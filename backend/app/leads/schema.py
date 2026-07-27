from __future__ import annotations

from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class LeadCreate(BaseModel):
    lead_id: str
    nombre: str
    whatsapp: str
    estado: str = "ACTIVO"
    tipo_inmueble: Optional[str] = None
    zona: Optional[str] = None
    superficie_m2: Optional[str] = None
    intencion: Optional[str] = None
    notas_encargado: Optional[str] = None


class LeadUpdate(BaseModel):
    nombre: Optional[str] = None
    estado: Optional[str] = None
    tipo_inmueble: Optional[str] = None
    zona: Optional[str] = None
    superficie_m2: Optional[str] = None
    intencion: Optional[str] = None
    notas_encargado: Optional[str] = None
    listo_para_cerrar: Optional[bool] = None
    seguimientos: Optional[int] = None


class LeadResponse(BaseModel):
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
