from sqlmodel import create_engine, Session

from app.core.settings import settings

engine = create_engine(settings.DATABASE_URL, echo=settings.SQL_ECHO)

# Engine secundario, solo lectura/borrado puntual sobre la base de n8n.
# None si N8N_DATABASE_URL no está configurada.
n8n_engine = create_engine(settings.N8N_DATABASE_URL) if settings.N8N_DATABASE_URL else None


def get_session():
    with Session(engine) as session:
        yield session
