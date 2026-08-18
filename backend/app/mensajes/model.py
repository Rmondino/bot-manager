from __future__ import annotations

from typing import Optional
from datetime import datetime

from sqlalchemy import Index
from sqlmodel import SQLModel, Field


class Mensaje(SQLModel, table=True):
    __tablename__ = "mensajes"

    # Compuesto en vez de simple: todas las queries filtran por lead y ordenan
    # por fecha, así el índice cubre las dos cosas.
    __table_args__ = (Index("ix_mensajes_lead_fecha", "lead_whatsapp", "fecha_hora"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    lead_whatsapp: str = Field(foreign_key="leads.whatsapp")
    fecha_hora: datetime = Field(default_factory=datetime.utcnow)
    origen: str
    mensaje: str
