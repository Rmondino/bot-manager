"""drop tabla companyinfo huerfana

Revision ID: ea60e4331fd3
Revises: fcd983da6444
Create Date: 2026-08-17 21:47:40.839399

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ea60e4331fd3'
down_revision: Union[str, Sequence[str], None] = 'fcd983da6444'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Borra `companyinfo`, sobrante de cuando el modelo se llamaba así.

    El modelo actual mapea a `company_info`. La tabla vieja quedó sin usar
    (0 filas) y create_all nunca la iba a borrar.
    """
    op.execute("DROP TABLE IF EXISTS companyinfo")


def downgrade() -> None:
    op.create_table(
        "companyinfo",
        sa.Column("id", sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column("nombre", sa.VARCHAR(), nullable=False),
        sa.Column("descripcion", sa.VARCHAR(), nullable=True),
        sa.Column("telefono", sa.VARCHAR(), nullable=True),
        sa.Column("email", sa.VARCHAR(), nullable=True),
        sa.Column("direccion", sa.VARCHAR(), nullable=True),
        sa.Column("sitio_web", sa.VARCHAR(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="companyinfo_pkey"),
    )
