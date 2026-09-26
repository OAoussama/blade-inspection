"""Contrat d'une éolienne — app/schemas/turbine.py"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TurbineRead(BaseModel):
    # protected_namespaces=() : sans lui, le champ `model` de la table
    # déclenche un avertissement Pydantic (espace de noms réservé).
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: UUID
    tag: str
    site_name: str | None
    latitude: float | None
    longitude: float | None
    model: str | None
    created_at: datetime

    # Agrégats calculés par la requête, absents de la table.
    inspection_count: int
    last_inspection_at: datetime | None
