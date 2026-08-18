"""fk mensajes-leads con cascade

Revision ID: 163597a549f5
Revises: ea60e4331fd3
Create Date: 2026-08-17 21:48:27.104633

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '163597a549f5'
down_revision: Union[str, Sequence[str], None] = 'ea60e4331fd3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Limpia los datos rotos y pone integridad referencial de verdad.

    `mensajes.lead_whatsapp` era un string suelto sin FK, así que la base
    aceptaba cualquier cosa. Había filas con el número sin normalizar y hasta
    una con el texto del mensaje en la columna del teléfono.
    """
    # 1. Normalizar: el sufijo de WhatsApp hacía que un mismo lead pareciera dos.
    op.execute(
        "UPDATE mensajes SET lead_whatsapp = replace(lead_whatsapp, '@s.whatsapp.net', '')"
    )

    # 2. Descartar lo que no sea un número de teléfono. Es dato irrecuperable:
    #    quedó con los campos cruzados por un nodo mal configurado.
    op.execute("DELETE FROM mensajes WHERE lead_whatsapp !~ '^[0-9]{8,15}$'")

    # 3. Los huérfanos tienen que irse antes de crear la FK, o falla el ALTER.
    op.execute(
        "DELETE FROM mensajes m WHERE NOT EXISTS "
        "(SELECT 1 FROM leads l WHERE l.whatsapp = m.lead_whatsapp)"
    )

    # 4. Postgres exige un UNIQUE constraint (no alcanza el índice único que
    #    genera SQLModel) para poder referenciar la columna desde una FK.
    op.execute(
        "ALTER TABLE leads ADD CONSTRAINT uq_leads_whatsapp UNIQUE USING INDEX ix_leads_whatsapp"
    )

    # 5. La FK con cascade reemplaza el borrado manual de mensajes que había
    #    en delete_lead.
    op.create_foreign_key(
        "fk_mensajes_lead",
        "mensajes",
        "leads",
        ["lead_whatsapp"],
        ["whatsapp"],
        ondelete="CASCADE",
        onupdate="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_mensajes_lead", "mensajes", type_="foreignkey")
    op.execute("ALTER TABLE leads DROP CONSTRAINT uq_leads_whatsapp")
    op.create_index("ix_leads_whatsapp", "leads", ["whatsapp"], unique=True)
