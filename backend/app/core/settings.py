from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    # Base de n8n. Solo se usa para limpiar la memoria del agente al borrar un lead.
    # Opcional: si no está seteada, esa limpieza se saltea (ver DECISIONS.md).
    N8N_DATABASE_URL: Optional[str] = None
    N8N_URL: str = "http://n8n:5678"
    # Loguear cada sentencia SQL. Útil en desarrollo, ruido puro en producción.
    SQL_ECHO: bool = False
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
