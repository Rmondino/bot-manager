from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_serializer

from app.core.serializers import a_utc_iso


class ChatItem(BaseModel):
    """Un lead con la preview de su última conversación, para la lista lateral."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    whatsapp: str
    estado: str
    listo_para_cerrar: bool
    ultimo_texto: Optional[str]
    ultimo_fecha: Optional[datetime]
    ultimo_origen: Optional[str]

    _ser_fecha = field_serializer("ultimo_fecha")(a_utc_iso)


class ChatsPage(BaseModel):
    items: List[ChatItem]
    total: int
