from typing import List, Literal, Optional
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_serializer

from app.core.serializers import a_utc_iso

# El front tipa `origen` como esta misma union y hace badgeOrigen[m.origen].bg,
# que rompe con cualquier otro valor. Acá se valida en el borde.
Origen = Literal["LEAD", "BOT", "HUMANO"]


class MensajeCreate(BaseModel):
    lead_whatsapp: str
    origen: Origen
    mensaje: str


class MensajeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_whatsapp: str
    fecha_hora: datetime
    origen: str
    mensaje: str

    _ser_fecha = field_serializer("fecha_hora")(a_utc_iso)


class MensajesPage(BaseModel):
    """Respuesta paginada. El front necesita el total para saber si hay más."""

    items: List[MensajeResponse]
    total: int
