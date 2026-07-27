from typing import Optional
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MensajeCreate(BaseModel):
    lead_whatsapp: str
    origen: str
    mensaje: str


class MensajeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_whatsapp: str
    fecha_hora: datetime
    origen: str
    mensaje: str
