from sqlmodel import SQLModel, Field
from datetime import datetime


class Mensaje(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    lead_id: int | None = Field(default=None, foreign_key="lead.id")
    texto: str
    remitente: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
