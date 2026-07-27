from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.core.settings import settings
from app.database import engine

from app.leads.router import router as leads_router
from app.mensajes.router import router as mensajes_router
from app.config.router import router as config_router
from app.company_info.router import router as company_info_router
from app.whatsapp.router import router as whatsapp_router
from app.n8n.router import router as n8n_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.leads.model import Lead
    from app.mensajes.model import Mensaje
    from app.config.model import BotConfig
    from app.company_info.model import CompanyInfo

    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(title="Bot Manager API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads_router)
app.include_router(mensajes_router)
app.include_router(config_router)
app.include_router(company_info_router)
app.include_router(whatsapp_router)
app.include_router(n8n_router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Bot Manager API"}
