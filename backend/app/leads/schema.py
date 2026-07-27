from typing import Optional
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LeadCreate(BaseModel):
    nombre: str
    whatsapp: str
    tipo_inmueble: Optional[str] = None
    zona: Optional[str] = None
    superficie_m2: Optional[str] = None
    intencion: Optional[str] = None


class LeadUpdate(BaseModel):
    estado: Optional[str] = None
    notas_encargado: Optional[str] = None
    listo_para_cerrar: Optional[bool] = None
    tipo_inmueble: Optional[str] = None
    zona: Optional[str] = None
    superficie_m2: Optional[str] = None
    intencion: Optional[str] = None
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
    notas_encargado: Optional[str]
    fecha_cierre: Optional[datetime]
    tipo_inmueble: Optional[str]
    zona: Optional[str]
    superficie_m2: Optional[str]
    intencion: Optional[str]
    created_at: datetime
    updated_at: datetime
