import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, text
from sqlmodel import Session, select

from app.database import get_session, n8n_engine
from app.leads.model import Lead
from app.leads.schema import LeadCreate, LeadUpdate, LeadResponse
from app.mensajes.model import Mensaje

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/leads", tags=["leads"])


def _borrar_memoria_n8n(whatsapp: str) -> int:
    """Borra el historial del agente en la base de n8n. Best-effort: si falla,
    el lead igual queda borrado y solo se loguea."""
    if not n8n_engine or not whatsapp:
        return 0
    # El sessionKey del nodo "Postgres Chat Memory" es el chat_id de WhatsApp,
    # que viene con sufijo. Probamos ambas formas por las dudas.
    sessions = [f"{whatsapp}@s.whatsapp.net", whatsapp]
    try:
        with n8n_engine.begin() as conn:
            result = conn.execute(
                text("DELETE FROM n8n_chat_histories WHERE session_id = ANY(:sessions)"),
                {"sessions": sessions},
            )
            return result.rowcount or 0
    except Exception as e:
        logger.warning("No se pudo limpiar la memoria n8n de %s: %s", whatsapp, e)
        return 0


@router.get("/", response_model=List[LeadResponse])
def list_leads(
    estado: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    query = select(Lead)
    if estado:
        query = query.where(Lead.estado == estado)
    leads = session.exec(query).all()
    return leads


@router.get("/whatsapp/{numero}", response_model=LeadResponse)
def get_lead_by_whatsapp(numero: str, session: Session = Depends(get_session)):
    lead = session.exec(select(Lead).where(Lead.whatsapp == numero)).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.get("/{id}/mensajes/count")
def count_mensajes_lead(id: int, session: Session = Depends(get_session)):
    """Cuántos mensajes se perderían al eliminar este lead."""
    lead = session.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    total = session.exec(
        select(func.count()).select_from(Mensaje).where(Mensaje.lead_whatsapp == lead.whatsapp)
    ).one()
    return {"total": total}


@router.get("/{id}", response_model=LeadResponse)
def get_lead(id: int, session: Session = Depends(get_session)):
    lead = session.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/", response_model=LeadResponse, status_code=201)
def create_lead(body: LeadCreate, session: Session = Depends(get_session)):
    lead_id = f"LEAD-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    lead = Lead(
        lead_id=lead_id,
        nombre=body.nombre,
        whatsapp=body.whatsapp,
        datos=body.datos,
    )
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return lead


@router.patch("/{id}", response_model=LeadResponse)
def update_lead(id: int, body: LeadUpdate, session: Session = Depends(get_session)):
    lead = session.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)
    lead.updated_at = datetime.utcnow()
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return lead


@router.delete("/{id}")
def delete_lead(id: int, session: Session = Depends(get_session)):
    lead = session.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    whatsapp = lead.whatsapp
    # Los mensajes se van solos: la FK fk_mensajes_lead tiene ON DELETE CASCADE.
    # Contamos antes para poder informarlo.
    mensajes_eliminados = session.exec(
        select(func.count()).select_from(Mensaje).where(Mensaje.lead_whatsapp == whatsapp)
    ).one()
    session.delete(lead)
    session.commit()
    # La memoria del agente vive en la base de n8n, ahí no llega la cascade.
    memoria = _borrar_memoria_n8n(whatsapp)
    return {
        "ok": True,
        "mensajes_eliminados": mensajes_eliminados,
        "memoria_eliminada": memoria,
    }
