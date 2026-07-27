from sqlmodel import SQLModel, Field


class Config(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    clave: str = Field(unique=True)
    valor: str
