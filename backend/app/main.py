from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.settings import settings

from app.leads.router import router as leads_router
from app.mensajes.router import router as mensajes_router
from app.config.router import router as config_router
from app.company_info.router import router as company_info_router
from app.campos_lead.router import router as campos_lead_router
from app.chats.router import router as chats_router
from app.whatsapp.router import router as whatsapp_router
from app.n8n.router import router as n8n_router


# El esquema lo maneja Alembic (`alembic upgrade head` al arrancar el contenedor),
# no create_all: create_all crea tablas nuevas pero nunca altera las existentes.
app = FastAPI(title="Bot Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads_router)
app.include_router(mensajes_router)
app.include_router(config_router)
app.include_router(company_info_router)
app.include_router(campos_lead_router)
app.include_router(chats_router)
app.include_router(whatsapp_router)
app.include_router(n8n_router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Bot Manager API"}
