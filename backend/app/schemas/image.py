"""Contrat d'une image — app/schemas/image.py"""

from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.detection import DetectionRead


class ImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: UUID
    original_filename: str | None
    width: int
    height: int
    detections: list[DetectionRead] = []

    @property
    def file_url(self) -> str:
        return f"/images/{self.id}/file"