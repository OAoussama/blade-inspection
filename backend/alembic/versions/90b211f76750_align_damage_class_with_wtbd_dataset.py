"""align damage_class with WTBD dataset

Revision ID: 90b211f76750
Revises: eba38cd15ca1
Create Date: 2026-09-16 20:12:34.826908

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90b211f76750'
down_revision: Union[str, Sequence[str], None] = 'eba38cd15ca1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
