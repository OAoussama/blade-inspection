"""Service d'inférence YOLOv8 — app/services/inference.py

Le contrat (signature de predict, RawDetection) est identique à celui de
l'implémentation factice : rien d'autre dans l'application ne change.
"""

import io
import logging
from dataclasses import dataclass
from functools import lru_cache

from PIL import Image as PILImage

from app.config import settings
from app.models import DamageClass

logger = logging.getLogger(__name__)

# Tag Hugging Face épinglé — jamais "main". Sans ça, un réentraînement
# changerait silencieusement ce que renvoie l'API, et model_version en
# base ne voudrait plus rien dire.
MODEL_VERSION = settings.model_revision


@dataclass(frozen=True)
class RawDetection:
    """Sortie brute du modèle, avant scoring de sévérité.

    bbox en coordonnées normalisées 0-1, coin supérieur gauche + dimensions.
    """

    damage_class: DamageClass
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float


@lru_cache(maxsize=1)
def _load_model():
    """Charge les poids une seule fois pour toute la durée du processus.

    hf_hub_download met en cache sur disque : seul le premier démarrage
    télécharge. Sans lru_cache, les poids seraient relus depuis le disque
    et rechargés en mémoire à chaque image — plusieurs secondes perdues.
    """
    from huggingface_hub import hf_hub_download
    from ultralytics import YOLO

    weights = hf_hub_download(
        repo_id=settings.model_repo,
        filename="best.pt",
        revision=settings.model_revision,
    )
    model = YOLO(weights)
    logger.info("Modèle chargé : %s@%s", settings.model_repo, settings.model_revision)
    logger.info("Classes du modèle : %s", model.names)
    return model


def warmup() -> None:
    """Précharge le modèle au démarrage de l'API.

    À appeler depuis le lifespan de FastAPI : sans ça, le tout premier
    upload paie le téléchargement et le chargement des poids.
    """
    _load_model()


def predict(image_bytes: bytes) -> list[RawDetection]:
    """Renvoie les dommages détectés sur une image."""
    model = _load_model()

    image = PILImage.open(io.BytesIO(image_bytes))
    # Le modèle attend 3 canaux : les PNG en RGBA ou les images en niveaux
    # de gris passeraient sinon en erreur.
    if image.mode != "RGB":
        image = image.convert("RGB")

    results = model.predict(
        image,
        imgsz=settings.model_imgsz,
        # Seuil relevé par rapport au défaut (0.25) : la matrice de
        # confusion montrait beaucoup de faux positifs sur fond propre.
        # L'outil sert au tri avant revue humaine — noyer l'opérateur sous
        # les fausses alertes coûte plus cher que rater un dommage léger.
        conf=settings.model_conf,
        verbose=False,
    )[0]

    detections: list[RawDetection] = []

    for box in results.boxes:
        # results.names vient du checkpoint lui-même, jamais d'une table
        # codée en dur : un réentraînement qui réordonne les classes ne
        # peut donc pas renommer silencieusement les détections.
        label = results.names[int(box.cls.item())]

        try:
            damage_class = DamageClass(label)
        except ValueError:
            # Classe présente dans les poids mais absente de l'énumération :
            # on ignore plutôt que de faire échouer toute l'inspection.
            logger.warning("Classe inconnue ignorée : %s", label)
            continue

        # xywhn : centre x, centre y, largeur, hauteur — déjà normalisés.
        # Le schéma attend le coin supérieur gauche, d'où la conversion.
        cx, cy, w, h = (float(v) for v in box.xywhn[0])

        # Une boîte touchant le bord peut dépasser légèrement de [0,1] après
        # arrondi, ce que refuseraient les CHECK constraints en base.
        x = min(max(cx - w / 2, 0.0), 1.0)
        y = min(max(cy - h / 2, 0.0), 1.0)
        w = min(w, 1.0 - x)
        h = min(h, 1.0 - y)

        if w <= 0 or h <= 0:
            continue

        detections.append(
            RawDetection(
                damage_class=damage_class,
                confidence=round(float(box.conf.item()), 4),
                bbox_x=round(x, 6),
                bbox_y=round(y, 6),
                bbox_w=round(w, 6),
                bbox_h=round(h, 6),
            )
        )

    return detections