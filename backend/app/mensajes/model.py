from __future__ import annotations

from typing import Optional
from datetime import datetime

from sqlmodel import SQLModel, Field


class Mensaje(SQLModel, table=True):
    __tablename__ = "mensajes"

    id: Optional[int] = Field(default=None, primary_key=True)
    lead_whatsapp: str = Field(index=True)
    fecha_hora: datetime = Field(default_factory=datetime.utcnow)
    origen: str
    mensaje: str
