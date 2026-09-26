"""app/api/routes/turbines.py"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Inspection, Turbine
from app.schemas.turbine import TurbineRead

router = APIRouter(prefix="/turbines", tags=["turbines"])


@router.get("", response_model=list[TurbineRead])
def list_turbines(db: Session = Depends(get_db)) -> list[TurbineRead]:
    # Une seule requête, agrégats compris : compter les inspections éolienne
    # par éolienne ferait N+1 appels.
    #
    # outerjoin et non join : une éolienne jamais inspectée doit ressortir
    # avec inspection_count = 0, pas disparaître du résultat.
    #
    # Le group_by ne porte que sur la clé primaire : Postgres en déduit les
    # autres colonnes de turbines, qui en dépendent fonctionnellement.
    stmt = (
        select(
            Turbine.id,
            Turbine.tag,
            Turbine.site_name,
            Turbine.latitude,
            Turbine.longitude,
            Turbine.model,
            Turbine.created_at,
            func.count(Inspection.id).label("inspection_count"),
            func.max(Inspection.created_at).label("last_inspection_at"),
        )
        .outerjoin(Inspection, Inspection.turbine_id == Turbine.id)
        .group_by(Turbine.id)
        .order_by(Turbine.tag)
    )

    # Les libellés du select correspondent aux champs du schéma : chaque Row
    # se valide directement grâce à from_attributes.
    return [TurbineRead.model_validate(row) for row in db.execute(stmt).all()]
