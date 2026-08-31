"""Contrat d'une inspection — app/schemas/inspection.py"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models import InspectionStatus
from app.schemas.image import ImageRead


class InspectionCreated(BaseModel):
    """Réponse au 202 : juste de quoi lancer le polling."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: UUID
    status: InspectionStatus


class InspectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: UUID
    turbine_id: UUID
    status: InspectionStatus
    model_version: str | None
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None
    images: list[ImageRead] = []