"""indice compuesto mensajes lead+fecha

Revision ID: f255bc620e5d
Revises: 163597a549f5
Create Date: 2026-08-17 21:51:59.214709

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f255bc620e5d'
down_revision: Union[str, Sequence[str], None] = '163597a549f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Índice que cubre filtro y orden a la vez.

    El índice existente es solo (lead_whatsapp) pero todas las queries ordenan
    por fecha_hora, así que Postgres tenía que ordenar aparte.
    """
    op.create_index(
        "ix_mensajes_lead_fecha",
        "mensajes",
        ["lead_whatsapp", "fecha_hora"],
        unique=False,
    )
    # El simple queda cubierto por el prefijo del compuesto.
    op.drop_index("ix_mensajes_lead_whatsapp", table_name="mensajes")


def downgrade() -> None:
    op.create_index(
        "ix_mensajes_lead_whatsapp", "mensajes", ["lead_whatsapp"], unique=False
    )
    op.drop_index("ix_mensajes_lead_fecha", table_name="mensajes")
