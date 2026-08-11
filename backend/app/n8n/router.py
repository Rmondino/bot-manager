from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlmodel import Session, select

from app.database import get_session
from app.leads.model import Lead
from app.mensajes.model import Mensaje
from app.config.model import BotConfig
from app.company_info.model import CompanyInfo

router = APIRouter(prefix="/n8n", tags=["n8n"])


@router.post("/lead/upsert")
def n8n_lead_upsert(
    body: dict,
    session: Session = Depends(get_session),
):
    whatsapp = str(body.get("whatsapp", ""))
    nombre = str(body.get("nombre", "Lead")) or "Lead"
    lead = session.exec(select(Lead).where(Lead.whatsapp == whatsapp)).first()
    if lead:
        lead.nombre = nombre
        session.add(lead)
        session.commit()
        session.refresh(lead)
        return {"lead": lead, "created": False}
    lead_id = f"LEAD-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    lead = Lead(
        lead_id=lead_id,
        nombre=nombre,
        whatsapp=whatsapp,
        estado="ACTIVO",
        ultimo_mensaje=datetime.utcnow(),
    )
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return {"lead": lead, "created": True}


@router.get("/lead/{whatsapp}")
def n8n_get_lead(
    whatsapp: str,
    session: Session = Depends(get_session),
):
    """Reemplaza el lookup de Google Sheets: devuelve el lead completo por whatsapp."""
    lead = session.exec(select(Lead).where(Lead.whatsapp == whatsapp)).first()
    if not lead:
        return {"existe": False}
    return {"existe": True, "lead": lead}


@router.patch("/lead/{whatsapp}/datos")
def n8n_update_lead_datos(
    whatsapp: str,
    body: dict,
    session: Session = Depends(get_session),
):
    """Reemplaza el update de campos de Google Sheets: actualiza datos de calificación."""
    lead = _get_or_create_lead(whatsapp, session)
    campos = ("nombre", "tipo_inmueble", "zona", "superficie_m2", "intencion", "notas_encargado")
    for campo in campos:
        if campo in body and body[campo] is not None:
            setattr(lead, campo, body[campo])
    lead.updated_at = datetime.utcnow()
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return lead


@router.get("/lead/{whatsapp}/estado")
def n8n_lead_estado(
    whatsapp: str,
    session: Session = Depends(get_session),
):
    lead = session.exec(select(Lead).where(Lead.whatsapp == whatsapp)).first()
    if not lead:
        return {"estado": "NO_EXISTE"}
    return {"estado": lead.estado}


@router.patch("/lead/{whatsapp}/estado")
def n8n_update_lead_estado(
    whatsapp: str,
    body: dict,
    session: Session = Depends(get_session),
):
    lead = _get_or_create_lead(whatsapp, session)
    lead.estado = body.get("estado", lead.estado)
    lead.updated_at = datetime.utcnow()
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return lead


def _get_or_create_lead(whatsapp: str, session: Session) -> Lead:
    lead = session.exec(select(Lead).where(Lead.whatsapp == whatsapp)).first()
    if not lead:
        lead_id = f"LEAD-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        lead = Lead(
            lead_id=lead_id,
            nombre=whatsapp,
            whatsapp=whatsapp,
            estado="ACTIVO",
        )
        session.add(lead)
        session.commit()
        session.refresh(lead)
    return lead


@router.patch("/lead/{whatsapp}/timestamp")
def n8n_update_lead_timestamp(
    whatsapp: str,
    session: Session = Depends(get_session),
):
    lead = _get_or_create_lead(whatsapp, session)
    lead.ultimo_mensaje = datetime.utcnow()
    lead.updated_at = datetime.utcnow()
    session.add(lead)
    session.commit()
    return {"ok": True}


@router.post("/mensaje")
def n8n_create_mensaje(
    body: dict,
    session: Session = Depends(get_session),
):
    cinco_min_atras = datetime.utcnow() - timedelta(minutes=5)

    # Si es LEAD y ya existe un BOT con mismo texto en últimos 30s → feedback loop, ignorar
    if body.get("origen") == "LEAD":
        echo = session.exec(
            select(Mensaje).where(
                Mensaje.lead_whatsapp == body["lead_whatsapp"],
                Mensaje.origen == "BOT",
                Mensaje.mensaje == body["mensaje"],
                Mensaje.fecha_hora >= datetime.utcnow() - timedelta(seconds=30),
            )
        ).first()
        if echo:
            return echo

    existente = session.exec(
        select(Mensaje).where(
            Mensaje.lead_whatsapp == body["lead_whatsapp"],
            Mensaje.origen == body["origen"],
            Mensaje.mensaje == body["mensaje"],
            Mensaje.fecha_hora >= cinco_min_atras,
        )
    ).first()
    if existente:
        return existente
    mensaje = Mensaje(
        lead_whatsapp=body["lead_whatsapp"],
        origen=body["origen"],
        mensaje=body["mensaje"],
    )
    session.add(mensaje)
    session.commit()
    session.refresh(mensaje)
    return mensaje


@router.get("/leads/seguimiento")
def n8n_leads_seguimiento(
    horas: int = Query(24),
    max_seguimientos: int = Query(1),
    session: Session = Depends(get_session),
):
    query = select(Lead).where(
        Lead.estado == "ACTIVO",
        Lead.seguimientos < max_seguimientos,
        Lead.ultimo_mensaje.isnot(None),
    )
    if horas > 0:
        corte = datetime.utcnow() - timedelta(hours=horas)
        query = query.where(Lead.ultimo_mensaje < corte)
    leads = session.exec(query).all()
    return leads


@router.patch("/lead/{whatsapp}/seguimiento")
def n8n_incrementar_seguimiento(
    whatsapp: str,
    session: Session = Depends(get_session),
):
    lead = _get_or_create_lead(whatsapp, session)
    lead.seguimientos += 1
    lead.estado = "HUMANO"
    lead.ultimo_mensaje = datetime.utcnow()
    lead.updated_at = datetime.utcnow()
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return lead


@router.get("/config")
def n8n_get_config(session: Session = Depends(get_session)):
    config = session.exec(select(BotConfig).limit(1)).first()
    if not config:
        return {
            "server_url": "",
            "instance_name": "",
            "apikey": "",
            "encargado_numero": "",
            "horas_seguimiento": 24,
            "max_seguimientos": 1,
            "mensaje_seguimiento": "Hola {nombre}, te escribimos desde {empresa}.",
            "nombre_empresa": "",
            "bot_activo": True,
        }
    return {
        "server_url": config.server_url,
        "instance_name": config.instance_name,
        "apikey": config.apikey,
        "encargado_numero": config.encargado_numero,
        "horas_seguimiento": config.horas_seguimiento,
        "max_seguimientos": config.max_seguimientos,
        "mensaje_seguimiento": config.mensaje_seguimiento,
        "nombre_empresa": config.nombre_empresa,
        "bot_activo": config.bot_activo,
    }


@router.get("/company-info/prompt", response_class=Response)
def n8n_company_info_prompt(session: Session = Depends(get_session)):
    items = session.exec(
        select(CompanyInfo).order_by(CompanyInfo.orden.asc())
    ).all()
    texto = "\n\n".join(f"P: {e.pregunta}\nR: {e.respuesta}" for e in items)
    return Response(content=texto, media_type="text/plain")
