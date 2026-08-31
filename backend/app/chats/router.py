from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select as sa_select
from sqlmodel import Session, select

from app.database import get_session
from app.chats.schema import ChatItem, ChatsPage
from app.leads.model import Lead
from app.mensajes.model import Mensaje

router = APIRouter(prefix="/chats", tags=["chats"])


def _ultimo_mensaje_por_lead():
    """Subconsulta con el último mensaje de cada conversación.

    DISTINCT ON aprovecha el índice compuesto (lead_whatsapp, fecha_hora), así
    que resuelve toda la lista en una query en vez de una por lead.
    """
    return (
        sa_select(
            Mensaje.lead_whatsapp.label("wa"),
            Mensaje.mensaje.label("texto"),
            Mensaje.fecha_hora.label("fecha"),
            Mensaje.origen.label("origen"),
        )
        .distinct(Mensaje.lead_whatsapp)
        .order_by(Mensaje.lead_whatsapp, Mensaje.fecha_hora.desc())
        .subquery()
    )


@router.get("/", response_model=ChatsPage)
def list_chats(
    q: Optional[str] = Query(None, description="Busca por nombre, número o texto de los mensajes"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
):
    """Lista de conversaciones con la preview del último mensaje.

    Se ordena por la fecha real del último mensaje y no por Lead.ultimo_mensaje:
    esa columna también la bumpea el seguimiento automático, así que un lead
    cuyo único evento reciente fue un recordatorio del bot subiría al tope sin
    que haya pasado nada en la conversación.
    """
    ultimo = _ultimo_mensaje_por_lead()

    filtros = []
    if q:
        patron = f"%{q}%"
        filtros.append(
            or_(
                Lead.nombre.ilike(patron),
                Lead.whatsapp.ilike(patron),
                # Que el chat aparezca por algo dicho adentro, no solo por su nombre.
                sa_select(Mensaje.id)
                .where(
                    Mensaje.lead_whatsapp == Lead.whatsapp,
                    Mensaje.mensaje.ilike(patron),
                )
                .exists(),
            )
        )

    total = session.exec(
        select(func.count()).select_from(Lead).where(*filtros)
    ).one()

    filas = session.exec(
        select(
            Lead.id,
            Lead.nombre,
            Lead.whatsapp,
            Lead.estado,
            Lead.listo_para_cerrar,
            ultimo.c.texto,
            ultimo.c.fecha,
            ultimo.c.origen,
        )
        .outerjoin(ultimo, ultimo.c.wa == Lead.whatsapp)
        .where(*filtros)
        .order_by(ultimo.c.fecha.desc().nullslast(), Lead.id.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    items = [
        ChatItem(
            id=f[0],
            nombre=f[1],
            whatsapp=f[2],
            estado=f[3],
            listo_para_cerrar=f[4],
            ultimo_texto=f[5],
            ultimo_fecha=f[6],
            ultimo_origen=f[7],
        )
        for f in filas
    ]
    return ChatsPage(items=items, total=total)
