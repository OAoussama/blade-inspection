"""Service d'inférence — app/services/inference.py

ÉTAPE 4 : implémentation FACTICE. Seul le corps de predict() changera
quand YOLOv8 arrivera ; sa signature et son type de retour sont figés.
"""

import random
import time
from dataclasses import dataclass

from app.models import DamageClass

# Ce que renverra le vrai modèle : version des poids utilisée.
MODEL_VERSION = "stub-0.1"


@dataclass(frozen=True)
class RawDetection:
    """Sortie brute du modèle, avant scoring de sévérité.

    bbox en coordonnées normalisées 0-1 — c'est déjà le format natif de
    YOLO, donc aucune conversion à écrire plus tard.
    """

    damage_class: DamageClass
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float


def predict(image_bytes: bytes) -> list[RawDetection]:
    """Renvoie les dommages détectés sur une image.

    À remplacer par :
        results = model(image)[0]
        return [RawDetection(...) for box in results.boxes]
    """
    # Simule le temps de calcul réel : sans ce délai, l'asynchrone n'est
    # jamais testé et les bugs de polling apparaissent en production.
    time.sleep(2)

    rng = random.Random(len(image_bytes))
    detections: list[RawDetection] = []

    for damage_class in (DamageClass.CRACK, DamageClass.EROSION):
        w = rng.uniform(0.05, 0.20)
        h = rng.uniform(0.05, 0.20)
        detections.append(
            RawDetection(
                damage_class=damage_class,
                confidence=round(rng.uniform(0.55, 0.95), 3),
                bbox_x=round(rng.uniform(0, 1 - w), 4),
                bbox_y=round(rng.uniform(0, 1 - h), 4),
                bbox_w=round(w, 4),
                bbox_h=round(h, 4),
            )
        )

    return detections