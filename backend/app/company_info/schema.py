from typing import Optional

from pydantic import BaseModel, ConfigDict


class CompanyInfoCreate(BaseModel):
    pregunta: str
    respuesta: str
    orden: int = 0


class CompanyInfoUpdate(BaseModel):
    pregunta: Optional[str] = None
    respuesta: Optional[str] = None
    orden: Optional[int] = None


class CompanyInfoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pregunta: str
    respuesta: str
    orden: int
