from __future__ import annotations

from typing import Optional
from datetime import datetime

from sqlmodel import SQLModel, Field


class BotConfig(SQLModel, table=True):
    __tablename__ = "bot_config"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre_empresa: str = Field(default="")
    encargado_numero: str = Field(default="")
    horas_seguimiento: int = Field(default=24)
    max_seguimientos: int = Field(default=1)
    mensaje_seguimiento: str = Field(
        default="Hola {nombre}, te escribimos desde {empresa}."
    )
    server_url: str = Field(default="")
    instance_name: str = Field(default="")
    apikey: str = Field(default="")
    bot_activo: bool = Field(default=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
