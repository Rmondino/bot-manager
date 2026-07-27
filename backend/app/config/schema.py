from typing import Optional
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BotConfigUpdate(BaseModel):
    nombre_empresa: Optional[str] = None
    encargado_numero: Optional[str] = None
    horas_seguimiento: Optional[int] = None
    max_seguimientos: Optional[int] = None
    mensaje_seguimiento: Optional[str] = None
    server_url: Optional[str] = None
    instance_name: Optional[str] = None
    apikey: Optional[str] = None
    bot_activo: Optional[bool] = None


class BotConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_empresa: str
    encargado_numero: str
    horas_seguimiento: int
    max_seguimientos: int
    mensaje_seguimiento: str
    server_url: str
    instance_name: str
    apikey: str
    bot_activo: bool
    updated_at: datetime
