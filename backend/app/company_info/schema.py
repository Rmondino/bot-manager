from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class CompanyInfoQACreate(BaseModel):
    pregunta: str
    respuesta: str
    orden: int = 0


class CompanyInfoQAUpdate(BaseModel):
    pregunta: Optional[str] = None
    respuesta: Optional[str] = None
    orden: Optional[int] = None


class CompanyInfoQAResponse(BaseModel):
    id: int
    pregunta: str
    respuesta: str
    orden: int
