"""Éoliennes de démonstration — scripts/seed.py

Exécution depuis backend/ : python -m scripts.seed

Idempotent : le rapprochement se fait sur le tag, qui porte une contrainte
d'unicité. Relancer le script ne duplique rien et n'échoue pas.
"""

from app.database import SessionLocal
from app.models import Turbine

TURBINES = [
    {
        "tag": "TRF-01",
        "site_name": "Parc éolien de Tarfaya",
        "latitude": 28.0339,
        "longitude": -12.9280,
        "model": "Siemens SWT-2.3-101",
    },
    {
        "tag": "TRF-02",
        "site_name": "Parc éolien de Tarfaya",
        "latitude": 28.0412,
        "longitude": -12.9195,
        "model": "Siemens SWT-2.3-101",
    },
    {
        "tag": "TRF-03",
        "site_name": "Parc éolien de Tarfaya",
        "latitude": 28.0287,
        "longitude": -12.9358,
        "model": "Siemens SWT-2.3-101",
    },
    {
        "tag": "MDL-01",
        "site_name": "Parc éolien de Midelt",
        "latitude": 32.6852,
        "longitude": -4.7451,
        "model": "Nordex N117/2400",
    },
    {
        "tag": "MDL-02",
        "site_name": "Parc éolien de Midelt",
        "latitude": 32.6914,
        "longitude": -4.7382,
        "model": "Nordex N117/2400",
    },
]


def main() -> None:
    created: list[str] = []
    existing: list[str] = []

    with SessionLocal() as db:
        for row in TURBINES:
            already_there = (
                db.query(Turbine).filter(Turbine.tag == row["tag"]).one_or_none()
            )
            if already_there is not None:
                existing.append(row["tag"])
                continue

            db.add(Turbine(**row))
            created.append(row["tag"])

        db.commit()

    print(f"Créées         : {len(created)} {' '.join(created)}".rstrip())
    print(f"Déjà présentes : {len(existing)} {' '.join(existing)}".rstrip())


if __name__ == "__main__":
    main()
