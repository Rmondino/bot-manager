from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.database import get_session
from app.leads.model import Lead
from app.leads.schema import LeadCreate, LeadUpdate, LeadResponse

router = APIRouter(prefix="/leads", tags=["leads"])


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
        tipo_inmueble=body.tipo_inmueble,
        zona=body.zona,
        superficie_m2=body.superficie_m2,
        intencion=body.intencion,
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
    session.delete(lead)
    session.commit()
    return {"ok": True}
