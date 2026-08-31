"""Contrat d'une détection — app/schemas/detection.py

C'EST LE FICHIER CLÉ DU SPRINT. Ce que YOLOv8 devra produire dans trois
semaines, c'est exactement cette forme. Le modèle s'adaptera au contrat,
pas l'inverse.
"""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models import DamageClass, Severity


class DetectionRead(BaseModel):
    # protected_namespaces=() : sans ça Pydantic v2 émet un avertissement sur
    # tout champ commençant par "model_" (voir model_version côté inspection).
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: UUID
    damage_class: DamageClass
    confidence: float = Field(ge=0, le=1)

    # Coordonnées NORMALISÉES 0-1, coin supérieur gauche + dimensions.
    # Le frontend multiplie par la taille affichée : aucun recalcul serveur.
    bbox_x: float = Field(ge=0, le=1)
    bbox_y: float = Field(ge=0, le=1)
    bbox_w: float = Field(gt=0, le=1)
    bbox_h: float = Field(gt=0, le=1)

    area_ratio: float
    severity: Severity