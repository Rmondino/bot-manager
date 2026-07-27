from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.database import get_session
from app.mensajes.model import Mensaje
from app.mensajes.schema import MensajeCreate, MensajeResponse

router = APIRouter(prefix="/mensajes", tags=["mensajes"])


@router.get("/", response_model=List[MensajeResponse])
def list_mensajes(
    whatsapp: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    query = select(Mensaje).order_by(Mensaje.fecha_hora.asc())
    if whatsapp:
        query = query.where(Mensaje.lead_whatsapp == whatsapp)
    mensajes = session.exec(query).all()
    return mensajes


@router.post("/", response_model=MensajeResponse, status_code=201)
def create_mensaje(body: MensajeCreate, session: Session = Depends(get_session)):
    mensaje = Mensaje(
        lead_whatsapp=body.lead_whatsapp,
        origen=body.origen,
        mensaje=body.mensaje,
    )
    session.add(mensaje)
    session.commit()
    session.refresh(mensaje)
    return mensaje


@router.delete("/{id}")
def delete_mensaje(id: int, session: Session = Depends(get_session)):
    mensaje = session.get(Mensaje, id)
    if not mensaje:
        raise HTTPException(status_code=404, detail="Mensaje not found")
    session.delete(mensaje)
    session.commit()
    return {"ok": True}
