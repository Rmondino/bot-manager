import httpx

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.config.model import BotConfig
from app.mensajes.model import Mensaje

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


@router.post("/send")
async def whatsapp_send(body: dict, session: Session = Depends(get_session)):
    config = session.exec(select(BotConfig).limit(1)).first()
    if not config or not config.server_url or not config.instance_name:
        raise HTTPException(status_code=400, detail="Configurá la instancia de WhatsApp primero")

    whatsapp = body["whatsapp"]
    texto = body["texto"]

    numero = whatsapp if whatsapp.endswith("@s.whatsapp.net") else f"{whatsapp}@s.whatsapp.net"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{config.server_url}/message/sendText/{config.instance_name}",
            headers={"apikey": config.apikey, "Content-Type": "application/json"},
            json={"number": numero, "text": texto},
            timeout=10.0,
        )

    if response.status_code >= 400:
        print(f"Evolution API error: {response.status_code} {response.text}")
        raise HTTPException(status_code=502, detail=f"Error de Evolution API: {response.text}")

    whatsapp_limpio = whatsapp.replace("@s.whatsapp.net", "")
    mensaje = Mensaje(
        lead_whatsapp=whatsapp_limpio,
        origen="HUMANO",
        mensaje=texto,
    )
    session.add(mensaje)
    session.commit()
    session.refresh(mensaje)

    print(f"[WhatsApp] Enviado a {numero}: {texto[:50]}...")
    return {"ok": True, "mensaje_guardado": mensaje}
