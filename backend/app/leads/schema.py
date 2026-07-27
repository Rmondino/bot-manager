from pydantic import BaseModel
from datetime import datetime


class LeadCreate(BaseModel):
    nombre: str
    telefono: str
    mensaje: str | None = None
    origen: str | None = None


class LeadUpdate(BaseModel):
    nombre: str | None = None
    telefono: str | None = None
    mensaje: str | None = None
    estado: str | None = None


class LeadResponse(BaseModel):
    id: int
    nombre: str
    telefono: str
    mensaje: str | None
    estado: str
    origen: str | None
    created_at: datetime
    updated_at: datetime
