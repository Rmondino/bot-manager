from sqlmodel import SQLModel, Field
from datetime import datetime


class Lead(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nombre: str
    telefono: str
    mensaje: str | None = None
    estado: str = "nuevo"
    origen: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
