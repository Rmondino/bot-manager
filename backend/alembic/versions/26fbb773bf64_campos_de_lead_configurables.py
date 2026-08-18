"""campos de lead configurables

Revision ID: 26fbb773bf64
Revises: f255bc620e5d
Create Date: 2026-08-17 23:57:48.757717

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
# El autogenerate emite sqlmodel.sql.sqltypes.AutoString() para los campos str
# de los modelos, pero no agrega este import. Sin él la migración falla con
# NameError al ejecutarse.
import sqlmodel
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '26fbb773bf64'
down_revision: Union[str, Sequence[str], None] = 'f255bc620e5d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


CAMPOS_INICIALES = [
    # Reproducen exactamente lo que hoy está escrito a mano en el system prompt
    # de n8n, para que al terminar la migración nada cambie de comportamiento.
    dict(
        clave="tipo_inmueble",
        etiqueta="Tipo de inmueble",
        descripcion=None,
        opciones="Casa,Departamento,Local,Galpón,Otro",
        tipo="opciones",
        pide_el_bot=True,
        orden=1,
    ),
    dict(
        clave="zona",
        etiqueta="Zona",
        descripcion="barrio o ciudad que mencione",
        opciones=None,
        tipo="texto",
        pide_el_bot=True,
        orden=2,
    ),
    dict(
        clave="superficie_m2",
        etiqueta="Superficie (m²)",
        descripcion="número en m² (solo el número)",
        opciones=None,
        tipo="numero",
        pide_el_bot=True,
        orden=3,
    ),
    dict(
        clave="intencion",
        etiqueta="Intención",
        descripcion=None,
        opciones="Nueva construcción,Refacción,Consulta técnica",
        tipo="opciones",
        pide_el_bot=True,
        orden=4,
    ),
    dict(
        clave="notas_encargado",
        etiqueta="Notas del encargado",
        descripcion=None,
        opciones=None,
        tipo="textarea",
        # Nota interna: no se le pide al bot, no va al prompt.
        pide_el_bot=False,
        orden=5,
    ),
]

COLUMNAS_VIEJAS = [
    "tipo_inmueble",
    "zona",
    "superficie_m2",
    "intencion",
    "notas_encargado",
]


def upgrade() -> None:
    """Pasa los datos de calificación de columnas fijas a JSONB configurable."""
    # 1. La columna nueva.
    op.add_column(
        "leads",
        sa.Column(
            "datos",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
    )

    # 2. Backfill. strip_nulls evita dejar claves con null para los leads que no
    #    tenían ese dato cargado.
    op.execute(
        """
        UPDATE leads SET datos = jsonb_strip_nulls(jsonb_build_object(
            'tipo_inmueble',   tipo_inmueble,
            'zona',            zona,
            'superficie_m2',   superficie_m2,
            'intencion',       intencion,
            'notas_encargado', notas_encargado
        ))
        """
    )

    # 3. La tabla de configuración.
    op.create_table(
        "campo_lead",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("clave", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("etiqueta", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("descripcion", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("opciones", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("tipo", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("pide_el_bot", sa.Boolean(), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_campo_lead_clave", "campo_lead", ["clave"], unique=True)

    # 4. Sembrar los campos que hoy existen, antes de borrar las columnas.
    campo_lead = sa.table(
        "campo_lead",
        sa.column("clave", sa.String),
        sa.column("etiqueta", sa.String),
        sa.column("descripcion", sa.String),
        sa.column("opciones", sa.String),
        sa.column("tipo", sa.String),
        sa.column("pide_el_bot", sa.Boolean),
        sa.column("activo", sa.Boolean),
        sa.column("orden", sa.Integer),
    )
    op.bulk_insert(campo_lead, [dict(c, activo=True) for c in CAMPOS_INICIALES])

    # 5. Recién ahora, las columnas viejas.
    for columna in COLUMNAS_VIEJAS:
        op.drop_column("leads", columna)


def downgrade() -> None:
    for columna in COLUMNAS_VIEJAS:
        op.add_column(
            "leads", sa.Column(columna, sqlmodel.sql.sqltypes.AutoString(), nullable=True)
        )
    # Devolver los valores a sus columnas. Lo que se haya cargado en campos
    # creados después de esta migración se pierde: no tienen dónde ir.
    for columna in COLUMNAS_VIEJAS:
        op.execute(f"UPDATE leads SET {columna} = datos->>'{columna}'")
    op.drop_index("ix_campo_lead_clave", table_name="campo_lead")
    op.drop_table("campo_lead")
    op.drop_column("leads", "datos")
