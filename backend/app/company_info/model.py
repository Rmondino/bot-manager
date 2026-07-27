from __future__ import annotations

from typing import Optional

from sqlmodel import SQLModel, Field


class CompanyInfo(SQLModel, table=True):
    __tablename__ = "company_info"

    id: Optional[int] = Field(default=None, primary_key=True)
    pregunta: str
    respuesta: str
    orden: int = Field(default=0)
