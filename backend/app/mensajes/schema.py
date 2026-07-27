from pydantic import BaseModel
from datetime import datetime


class MensajeCreate(BaseModel):
    lead_id: int | None = None
    texto: str
    remitente: str


class MensajeResponse(BaseModel):
    id: int
    lead_id: int | None
    texto: str
    remitente: str
    created_at: datetime
