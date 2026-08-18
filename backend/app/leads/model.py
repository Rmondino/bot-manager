from __future__ import annotations

from typing import Any, Dict, Optional
from datetime import datetime

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import SQLModel, Field


class Lead(SQLModel, table=True):
    __tablename__ = "leads"

    id: Optional[int] = Field(default=None, primary_key=True)
    lead_id: str = Field(unique=True, index=True)
    nombre: str
    whatsapp: str = Field(unique=True, index=True)
    fecha_ingreso: datetime = Field(default_factory=datetime.utcnow)
    estado: str = Field(default="ACTIVO")
    ultimo_mensaje: Optional[datetime] = Field(default=None)
    seguimientos: int = Field(default=0)
    listo_para_cerrar: bool = Field(default=False)
    fecha_cierre: Optional[datetime] = Field(default=None)
    # Datos de calificación, con las claves que define la tabla campo_lead.
    # Antes eran columnas fijas (tipo_inmueble, zona, superficie_m2, intencion,
    # notas_encargado) y agregar una requería migración + cambios en 12 lugares.
    datos: Dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}")
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
