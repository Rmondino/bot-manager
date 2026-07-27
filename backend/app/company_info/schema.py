from pydantic import BaseModel


class CompanyInfoUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    telefono: str | None = None
    email: str | None = None
    direccion: str | None = None
    sitio_web: str | None = None


class CompanyInfoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str | None
    telefono: str | None
    email: str | None
    direccion: str | None
    sitio_web: str | None
