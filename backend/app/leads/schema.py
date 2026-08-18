from typing import Any, Dict, Optional
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_serializer

from app.core.serializers import a_utc_iso


class LeadCreate(BaseModel):
    nombre: str
    whatsapp: str
    # Claves definidas en campo_lead. Ver GET /campos-lead/
    datos: Dict[str, Any] = {}


class LeadUpdate(BaseModel):
    estado: Optional[str] = None
    listo_para_cerrar: Optional[bool] = None
    datos: Optional[Dict[str, Any]] = None
    fecha_cierre: Optional[datetime] = None


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: str
    nombre: str
    whatsapp: str
    fecha_ingreso: datetime
    estado: str
    ultimo_mensaje: Optional[datetime]
    seguimientos: int
    listo_para_cerrar: bool
    fecha_cierre: Optional[datetime]
    datos: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    _ser_fechas = field_serializer(
        "fecha_ingreso", "ultimo_mensaje", "fecha_cierre", "created_at", "updated_at"
    )(a_utc_iso)
