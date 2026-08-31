"""app/api/routes/inspections.py

Le router valide, appelle un service, formate. Aucune logique métier ici.
"""

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_storage
from app.config import settings
from app.database import get_db
from app.models import Image, Inspection
from app.schemas.inspection import InspectionCreated, InspectionRead
from app.services import inspections as service
from app.storage.base import Storage

router = APIRouter(prefix="/inspections", tags=["inspections"])


@router.post("", response_model=InspectionCreated, status_code=202)
async def create_inspection(
    background: BackgroundTasks,
    turbine_id: UUID = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    storage: Storage = Depends(get_storage),
) -> Inspection:
    if len(files) > settings.max_images_per_inspection:
        raise HTTPException(413, f"Maximum {settings.max_images_per_inspection} images par envoi")

    incoming: list[service.IncomingFile] = []
    for upload in files:
        content = await upload.read()
        if len(content) > settings.max_upload_bytes:
            raise HTTPException(413, f"{upload.filename} dépasse la taille maximale autorisée")
        incoming.append(service.IncomingFile(filename=upload.filename, content=content))

    try:
        inspection = service.create_inspection(db, storage, turbine_id, incoming)
    except service.InvalidImageError as exc:
        raise HTTPException(422, str(exc)) from exc
    except service.DuplicateImageError as exc:
        raise HTTPException(409, str(exc)) from exc

    # Après le commit, jamais avant : le job doit trouver l'inspection en base.
    background.add_task(service.run_inference, inspection.id, storage)

    # 202 Accepted : la requête est acceptée, le traitement n'est pas terminé.
    # Le client poll ensuite GET /inspections/{id}.
    return inspection


@router.get("/{inspection_id}", response_model=InspectionRead)
def get_inspection(inspection_id: UUID, db: Session = Depends(get_db)) -> Inspection:
    inspection = (
        db.query(Inspection)
        # selectinload évite le N+1 : sans lui, une inspection de 30 images
        # déclenche 61 requêtes SQL.
        .options(selectinload(Inspection.images).selectinload(Image.detections))
        .filter(Inspection.id == inspection_id)
        .one_or_none()
    )
    if inspection is None:
        raise HTTPException(404, "Inspection introuvable")
    return inspection