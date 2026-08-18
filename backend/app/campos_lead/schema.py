import re
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, field_validator

TIPOS = ("texto", "numero", "opciones", "textarea")
Tipo = Literal["texto", "numero", "opciones", "textarea"]

_CLAVE_RE = re.compile(r"^[a-z][a-z0-9_]*$")


class CampoLeadCreate(BaseModel):
    clave: str
    etiqueta: str
    descripcion: Optional[str] = None
    opciones: Optional[str] = None
    tipo: Tipo = "texto"
    pide_el_bot: bool = True
    activo: bool = True
    orden: int = 0

    @field_validator("clave")
    @classmethod
    def clave_es_identificador(cls, v: str) -> str:
        # La escribe el AI en el body del tool y es la key del JSON: un espacio,
        # un acento o una mayúscula rompen el contrato en silencio.
        v = v.strip()
        if not _CLAVE_RE.match(v):
            raise ValueError(
                "la clave debe ser snake_case: minúsculas, números y guion bajo, "
                "empezando por letra (ej: tipo_inmueble)"
            )
        return v


class CampoLeadUpdate(BaseModel):
    """`clave` no está: es inmutable una vez creado el campo."""

    etiqueta: Optional[str] = None
    descripcion: Optional[str] = None
    opciones: Optional[str] = None
    tipo: Optional[Tipo] = None
    pide_el_bot: Optional[bool] = None
    activo: Optional[bool] = None
    orden: Optional[int] = None


class CampoLeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clave: str
    etiqueta: str
    descripcion: Optional[str]
    opciones: Optional[str]
    tipo: str
    pide_el_bot: bool
    activo: bool
    orden: int


class LeadConDato(BaseModel):
    nombre: str
    whatsapp: str
    valor: Optional[str]


class UsoCampo(BaseModel):
    """Qué se perdería al borrar un campo. Alimenta la confirmación de borrado."""

    total: int
    leads: List[LeadConDato]
