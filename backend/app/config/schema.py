from pydantic import BaseModel


class ConfigCreate(BaseModel):
    clave: str
    valor: str


class ConfigUpdate(BaseModel):
    valor: str


class ConfigResponse(BaseModel):
    id: int
    clave: str
    valor: str
