from __future__ import annotations

from typing import Optional
from datetime import datetime

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
    notas_encargado: Optional[str] = Field(default=None)
    fecha_cierre: Optional[datetime] = Field(default=None)
    tipo_inmueble: Optional[str] = Field(default=None)
    zona: Optional[str] = Field(default=None)
    superficie_m2: Optional[str] = Field(default=None)
    intencion: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
