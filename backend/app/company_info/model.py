from sqlmodel import SQLModel, Field


class CompanyInfo(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nombre: str = "Aislaciones RH"
    descripcion: str | None = None
    telefono: str | None = None
    email: str | None = None
    direccion: str | None = None
    sitio_web: str | None = None
