"""Règles de sévérité — app/services/severity.py

Volontairement à base de règles, pas d'un second réseau : c'est
explicable en revue, et chaque seuil se justifie. Un classifieur de
sévérité entraîné serait une amélioration ultérieure.
"""

from app.models import DamageClass, Severity

# Poids par classe : à surface égale, toutes les avaries ne se valent pas.
#
# - crack          : fissure structurelle, se propage sous charge cyclique.
#                    C'est le mode de défaillance qui mène à la rupture.
# - thunderstrike  : impact de foudre, dommage interne probable au-delà de
#                    ce qui est visible en surface.
# - hide_craze     : faïençage peu visible — ce qu'on détecte en surface
#                    sous-estime probablement l'étendue réelle.
# - craze          : faïençage visible, précurseur de fissuration.
# - corrosion      : dégradation lente, surveillance plutôt qu'urgence.
# - surface_injure : atteinte de surface, souvent cosmétique ou érosive.
#
# Ces poids traduisent une hiérarchie d'urgence de maintenance, pas une
# gravité physique mesurée. À valider avec l'entreprise.
CLASS_WEIGHT: dict[DamageClass, float] = {
    DamageClass.CRACK: 1.0,
    DamageClass.THUNDERSTRIKE: 0.9,
    DamageClass.HIDE_CRAZE: 0.7,
    DamageClass.CRAZE: 0.6,
    DamageClass.CORROSION: 0.5,
    DamageClass.SURFACE_INJURE: 0.4,
}

# Seuils du score = area_ratio x poids de classe x confiance.
CRITICAL_THRESHOLD = 0.08
HIGH_THRESHOLD = 0.03
MEDIUM_THRESHOLD = 0.01


def score_severity(damage_class: DamageClass, area_ratio: float, confidence: float) -> Severity:
    """Classe une détection en sévérité.

    area_ratio est la part de l'image occupée par la boîte (0-1), donc une
    mesure d'étendue relative — pas une surface physique en m². Deux photos
    prises à des distances différentes ne sont pas comparables directement.
    C'est une limite connue, à corriger le jour où la distance de vol ou
    l'échelle de la pale sera disponible.
    """
    # .get() plutôt qu'un accès direct : si le modèle est réentraîné avec
    # une classe supplémentaire, l'API renvoie une sévérité prudente au
    # lieu de lever une KeyError en plein job d'inférence.
    weight = CLASS_WEIGHT.get(damage_class, 0.5)
    score = area_ratio * weight * confidence

    if score >= CRITICAL_THRESHOLD:
        return Severity.CRITICAL
    if score >= HIGH_THRESHOLD:
        return Severity.HIGH
    if score >= MEDIUM_THRESHOLD:
        return Severity.MEDIUM
    return Severity.LOW