"""fix image checksum unique scope

Revision ID: cb689e7e085b
Revises: accd0368ffc2
Create Date: 2026-08-29 18:22:47.425457

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cb689e7e085b'
down_revision: Union[str, Sequence[str], None] = 'accd0368ffc2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint("images_checksum_key", "images", type_="unique")
    op.create_unique_constraint(
        "uq_images_inspection_checksum", "images", ["inspection_id", "checksum"]
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("uq_images_inspection_checksum", "images", type_="unique")
    op.create_unique_constraint("images_checksum_key", "images", ["checksum"])
