"""Logique métier des inspections — app/services/inspections.py

Aucun import de FastAPI ici : ni Request, ni UploadFile, ni HTTPException.
Ce module est appelable depuis une route HTTP comme depuis un worker,
et testable sans lancer de serveur.
"""

import hashlib
import io
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4

from PIL import Image as PILImage
from PIL import UnidentifiedImageError
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Detection, Image, Inspection, InspectionStatus
from app.services import inference
from app.services.severity import score_severity
from app.storage.base import Storage


class InvalidImageError(ValueError):
    """Fichier illisible ou non reconnu comme image."""


class DuplicateImageError(ValueError):
    """Image déjà présente dans cette inspection."""


@dataclass(frozen=True)
class IncomingFile:
    filename: str | None
    content: bytes


def _inspect_bytes(content: bytes) -> tuple[int, int]:
    """Valide que le contenu est bien une image et renvoie ses dimensions.

    On ne fait AUCUNE confiance à l'extension ni au Content-Type envoyés :
    seul le décodage réel du fichier fait foi.
    """
    try:
        with PILImage.open(io.BytesIO(content)) as img:
            img.verify()
        with PILImage.open(io.BytesIO(content)) as img:
            return img.width, img.height
    except (UnidentifiedImageError, OSError) as exc:
        raise InvalidImageError("Fichier illisible ou format non supporté") from exc


def create_inspection(
    db: Session,
    storage: Storage,
    turbine_id: UUID,
    files: list[IncomingFile],
) -> Inspection:
    """Crée l'inspection et ses images. NE lance PAS l'inférence.

    Le déclenchement du job est laissé à l'appelant, qui doit le faire
    APRÈS le commit : sinon le worker cherche une inspection qui n'existe
    pas encore en base.
    """
    inspection = Inspection(id=uuid4(), turbine_id=turbine_id, status=InspectionStatus.QUEUED)
    db.add(inspection)

    seen: set[str] = set()

    for item in files:
        width, height = _inspect_bytes(item.content)
        checksum = hashlib.sha256(item.content).hexdigest()

        if checksum in seen:
            raise DuplicateImageError(f"Image en double dans l'envoi : {item.filename}")
        seen.add(checksum)

        image_id = uuid4()
        # Clé RELATIVE : valide comme chemin disque et comme clé d'objet S3.
        # Le nom d'origine n'est jamais réutilisé (risque de path traversal).
        key = f"inspections/{inspection.id}/{image_id}.jpg"
        storage.save(key, item.content)

        db.add(
            Image(
                id=image_id,
                inspection_id=inspection.id,
                storage_key=key,
                original_filename=item.filename,
                checksum=checksum,
                width=width,
                height=height,
            )
        )

    # Une seule transaction pour l'inspection et toutes ses images.
    db.commit()
    db.refresh(inspection)
    return inspection


def run_inference(inspection_id: UUID, storage: Storage) -> None:
    """Job d'arrière-plan : lit les images, prédit, écrit les détections.

    Ouvre sa PROPRE session : celle de la requête HTTP est déjà fermée
    quand BackgroundTasks s'exécute.
    """
    db = SessionLocal()
    try:
        inspection = db.get(Inspection, inspection_id)
        if inspection is None:
            return

        inspection.status = InspectionStatus.PROCESSING
        inspection.model_version = inference.MODEL_VERSION
        db.commit()

        images = db.query(Image).filter(Image.inspection_id == inspection_id).all()

        for image in images:
            with storage.open(image.storage_key) as fh:
                content = fh.read()

            for raw in inference.predict(content):
                db.add(
                    Detection(
                        image_id=image.id,
                        damage_class=raw.damage_class,
                        confidence=raw.confidence,
                        bbox_x=raw.bbox_x,
                        bbox_y=raw.bbox_y,
                        bbox_w=raw.bbox_w,
                        bbox_h=raw.bbox_h,
                        severity=score_severity(
                            raw.damage_class,
                            raw.bbox_w * raw.bbox_h,
                            raw.confidence,
                        ),
                    )
                )

        inspection.status = InspectionStatus.DONE
        inspection.completed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as exc:  # noqa: BLE001
        # Un job qui échoue en silence laisse le frontend en polling
        # infini. On persiste toujours l'échec.
        db.rollback()
        inspection = db.get(Inspection, inspection_id)
        if inspection is not None:
            inspection.status = InspectionStatus.FAILED
            inspection.error_message = str(exc)[:1024]
            inspection.completed_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()