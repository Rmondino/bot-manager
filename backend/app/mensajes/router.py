from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlmodel import Session, select

from app.database import get_session
from app.mensajes.model import Mensaje
from app.mensajes.schema import MensajeCreate, MensajeResponse, MensajesPage

router = APIRouter(prefix="/mensajes", tags=["mensajes"])


@router.get("/", response_model=MensajesPage)
def list_mensajes(
    whatsapp: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Busca en el texto y en el número"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    orden: str = Query("asc", pattern="^(asc|desc)$"),
    session: Session = Depends(get_session),
):
    """Devuelve una página de mensajes más el total.

    Antes esto devolvía la tabla entera y el front paginaba y buscaba en el
    cliente, lo que obligaba a descargar todo el historial en cada request.
    """
    filtros = []
    if whatsapp:
        filtros.append(Mensaje.lead_whatsapp == whatsapp)
    if q:
        patron = f"%{q}%"
        # La búsqueda tiene que ser server-side: si no, solo encontraría dentro
        # de la página ya descargada.
        filtros.append(
            Mensaje.mensaje.ilike(patron) | Mensaje.lead_whatsapp.ilike(patron)
        )

    total = session.exec(
        select(func.count()).select_from(Mensaje).where(*filtros)
    ).one()

    orden_col = (
        Mensaje.fecha_hora.asc() if orden == "asc" else Mensaje.fecha_hora.desc()
    )
    items = session.exec(
        select(Mensaje).where(*filtros).order_by(orden_col).limit(limit).offset(offset)
    ).all()
    return MensajesPage(items=items, total=total)


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
