from __future__ import annotations

from typing import Optional

from sqlmodel import SQLModel, Field


class CampoLead(SQLModel, table=True):
    """Define qué información se le pide al lead.

    Antes esto eran columnas fijas en `leads` (tipo_inmueble, zona, ...), así que
    cambiar lo que el bot recopila requería tocar el modelo, los schemas, la UI y
    el prompt de n8n. Ahora se configura desde la app y los valores viven en
    `leads.datos` (JSONB) bajo `clave`.
    """

    __tablename__ = "campo_lead"

    id: Optional[int] = Field(default=None, primary_key=True)
    # La key dentro de leads.datos y lo que el AI manda en el body del tool.
    # Inmutable una vez creada: renombrarla dejaría los valores bajo la clave
    # anterior, sin ningún error visible.
    clave: str = Field(unique=True, index=True)
    etiqueta: str
    descripcion: Optional[str] = Field(default=None)
    # Valores permitidos separados por coma, para tipo == "opciones".
    opciones: Optional[str] = Field(default=None)
    tipo: str = Field(default="texto")
    # False para notas internas del encargado, que no se le piden al bot.
    pide_el_bot: bool = Field(default=True)
    # Desactivar saca el campo del prompt y del formulario, pero los leads que ya
    # tenían valor lo siguen mostrando. Borrar es lo que purga los datos.
    activo: bool = Field(default=True)
    orden: int = Field(default=0)
