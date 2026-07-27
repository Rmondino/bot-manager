from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    N8N_URL: str = "http://n8n:5678"
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
