"""align damage_class with WTBD dataset

Revision ID: eba38cd15ca1
Revises: cb689e7e085b
Create Date: 2026-09-16 19:59:20.919175

"""
"""align damage_class with the WTBD dataset classes
 
Ancien type  : crack, erosion, lightning_strike, delamination
Nouveau type : craze, corrosion, surface_injure, thunderstrike, crack, hide_craze
 
ALTER TYPE ... ADD VALUE ne suffit pas ici : on ajoute ET on retire des
valeurs. Il faut donc recreer le type et rebrancher la colonne.
 
Genere le fichier avec :
    alembic revision -m "align damage_class with WTBD dataset"
puis recopie le corps des deux fonctions ci-dessous en gardant les
identifiants revision / down_revision deja presents dans ton fichier."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eba38cd15ca1'
down_revision: Union[str, Sequence[str], None] = 'cb689e7e085b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


OLD_VALUES = "'crack','erosion','lightning_strike','delamination'"
NEW_VALUES = "'craze','corrosion','surface_injure','thunderstrike','crack','hide_craze'"

def upgrade() -> None:
    # Les detections existantes proviennent du modele factice : elles n'ont
    # aucune valeur scientifique et leurs classes n'existent plus dans le
    # nouveau type. On les supprime plutot que d'inventer une equivalence.
    # ON DELETE CASCADE ne s'applique pas ici (on vide une table, pas un parent).
    op.execute("DELETE FROM detections")
 
    op.execute("ALTER TYPE damage_class RENAME TO damage_class_old")
    op.execute(f"CREATE TYPE damage_class AS ENUM ({NEW_VALUES})")
    op.execute(
        "ALTER TABLE detections "
        "ALTER COLUMN damage_class TYPE damage_class "
        "USING damage_class::text::damage_class"
    )
    op.execute("DROP TYPE damage_class_old")


def downgrade() -> None:
    op.execute("DELETE FROM detections")
 
    op.execute("ALTER TYPE damage_class RENAME TO damage_class_new")
    op.execute(f"CREATE TYPE damage_class AS ENUM ({OLD_VALUES})")
    op.execute(
        "ALTER TABLE detections "
        "ALTER COLUMN damage_class TYPE damage_class "
        "USING damage_class::text::damage_class"
    )
    op.execute("DROP TYPE damage_class_new")