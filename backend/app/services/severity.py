"""Règles de sévérité — app/services/severity.py

Volontairement à base de règles, pas d'un second réseau : c'est
explicable en revue, et tu peux justifier chaque seuil. Un classifieur
de sévérité entraîné serait une amélioration de sprint 3, pas de sprint 1.
"""

from app.models import DamageClass, Severity

# Une fissure de la même taille qu'une zone d'érosion est plus grave :
# la fissure se propage, l'érosion s'étale.
CLASS_WEIGHT: dict[DamageClass, float] = {
    DamageClass.CRACK: 1.0,
    DamageClass.LIGHTNING_STRIKE: 0.9,
    DamageClass.DELAMINATION: 0.7,
    DamageClass.EROSION: 0.4,
}


def score_severity(damage_class: DamageClass, area_ratio: float, confidence: float) -> Severity:
    score = area_ratio * CLASS_WEIGHT[damage_class] * confidence

    if score >= 0.08:
        return Severity.CRITICAL
    if score >= 0.03:
        return Severity.HIGH
    if score >= 0.01:
        return Severity.MEDIUM
    return Severity.LOW