from __future__ import annotations

from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class MensajeCreate(BaseModel):
    lead_whatsapp: str
    origen: str
    mensaje: str


class MensajeResponse(BaseModel):
    id: int
    lead_whatsapp: str
    fecha_hora: datetime
    origen: str
    mensaje: str
