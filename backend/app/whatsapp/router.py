import logging
from datetime import datetime

import httpx

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.whatsapp import SUFIJO_WHATSAPP, normalizar_whatsapp
from app.database import get_session
from app.config.model import BotConfig
from app.leads.model import Lead
from app.mensajes.model import Mensaje
from app.mensajes.schema import MensajeResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


class WhatsappSend(BaseModel):
    whatsapp: str
    texto: str


@router.post("/send")
async def whatsapp_send(body: WhatsappSend, session: Session = Depends(get_session)):
    config = session.exec(select(BotConfig).limit(1)).first()
    if not config or not config.server_url or not config.instance_name:
        raise HTTPException(status_code=400, detail="Configurá la instancia de WhatsApp primero")

    whatsapp = normalizar_whatsapp(body.whatsapp)
    texto = body.texto

    lead = session.exec(select(Lead).where(Lead.whatsapp == whatsapp)).first()
    if not lead:
        raise HTTPException(status_code=404, detail=f"No existe el lead {whatsapp}")

    numero = f"{whatsapp}{SUFIJO_WHATSAPP}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config.server_url}/message/sendText/{config.instance_name}",
                headers={"apikey": config.apikey, "Content-Type": "application/json"},
                json={"number": numero, "text": texto},
                timeout=10.0,
            )
    except httpx.RequestError as e:
        logger.error("Evolution API connection error: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"No se pudo conectar con Evolution API: {e}",
        )

    if response.status_code >= 400:
        # El body del upstream puede traer detalles internos: se loguea, no se devuelve.
        logger.error("Evolution API error: %s %s", response.status_code, response.text)
        raise HTTPException(
            status_code=502,
            detail=f"Evolution API respondió {response.status_code}",
        )

    mensaje = Mensaje(
        lead_whatsapp=whatsapp,
        origen="HUMANO",
        mensaje=texto,
    )
    session.add(mensaje)
    # El flujo de n8n toca ultimo_mensaje en cada mensaje entrante; acá faltaba,
    # así que un chat llevado a mano dejaba al lead como inactivo para el seguimiento.
    lead.ultimo_mensaje = datetime.utcnow()
    lead.updated_at = datetime.utcnow()
    session.add(lead)
    session.commit()
    session.refresh(mensaje)

    logger.info("[WhatsApp] Enviado a %s: %.50s", numero, texto)
    return {"ok": True, "mensaje_guardado": MensajeResponse.model_validate(mensaje)}
