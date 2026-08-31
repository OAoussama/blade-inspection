"""app/api/routes/images.py"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_storage
from app.database import get_db
from app.models import Image
from app.storage.base import Storage

router = APIRouter(prefix="/images", tags=["images"])


@router.get("/{image_id}/file")
def get_image_file(
    image_id: UUID,
    db: Session = Depends(get_db),
    storage: Storage = Depends(get_storage),
) -> StreamingResponse:
    """Sert le fichier via l'application, pas en statique.

    Monter storage/ en statique laisserait n'importe qui deviner des URLs
    et lire les inspections des autres. Ici on pourra brancher un contrôle
    d'accès, et plus tard renvoyer une URL signée MinIO.
    """
    image = db.get(Image, image_id)
    if image is None:
        raise HTTPException(404, "Image introuvable")

    return StreamingResponse(
        storage.open(image.storage_key),
        media_type="image/jpeg",
        headers={"Cache-Control": "private, max-age=3600"},
    )