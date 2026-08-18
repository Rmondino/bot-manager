import logging
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlmodel import Session, select

from app.campos_lead.model import CampoLead
from app.core.whatsapp import normalizar_whatsapp
from app.database import get_session
from app.leads.model import Lead
from app.mensajes.model import Mensaje
from app.mensajes.schema import MensajeCreate, MensajeResponse
from app.config.model import BotConfig
from app.company_info.model import CompanyInfo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/n8n", tags=["n8n"])

# Corta de raíz los leads basura: un nodo de n8n mal configurado manda el body
# vacío o la expresión sin evaluar, y antes se creaba un lead igual.
_validar_whatsapp = normalizar_whatsapp


@router.post("/lead/upsert")
def n8n_lead_upsert(
    body: dict,
    session: Session = Depends(get_session),
):
    whatsapp = _validar_whatsapp(str(body.get("whatsapp", "")))
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
    """Guarda los datos de calificación que manda el AI Agent.

    Las claves válidas salen de la tabla campo_lead, no de una lista fija.
    """
    lead = _get_or_create_lead(whatsapp, session)

    if "nombre" in body and body["nombre"] is not None:
        # nombre es columna real, no un campo configurable.
        lead.nombre = body["nombre"]

    claves_validas = {
        c.clave
        for c in session.exec(select(CampoLead).where(CampoLead.activo == True)).all()  # noqa: E712
    }
    datos = dict(lead.datos or {})
    ignoradas = []
    for clave, valor in body.items():
        if clave == "nombre":
            continue
        if clave not in claves_validas:
            ignoradas.append(clave)
            continue
        if valor is not None:
            datos[clave] = valor

    if ignoradas:
        # No se rechaza la request: el AI puede inventar una clave y hacer fallar
        # el nodo por eso dejaría sin guardar los datos buenos del mismo mensaje.
        logger.warning(
            "Claves no configuradas ignoradas para %s: %s", whatsapp, ignoradas
        )

    lead.datos = datos
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
    if "listo_para_cerrar" in body:
        # n8n manda los bodyParameters como texto, así que bool("false") daría True
        lead.listo_para_cerrar = str(body["listo_para_cerrar"]).strip().lower() in ("true", "1")
        if lead.listo_para_cerrar and not lead.fecha_cierre:
            lead.fecha_cierre = datetime.utcnow()
    lead.updated_at = datetime.utcnow()
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return lead


def _get_or_create_lead(whatsapp: str, session: Session) -> Lead:
    lead = session.exec(select(Lead).where(Lead.whatsapp == whatsapp)).first()
    if not lead:
        # Validamos solo al crear: un lead ya guardado con otro formato sigue andando.
        _validar_whatsapp(whatsapp)
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


@router.post("/mensaje", response_model=MensajeResponse)
def n8n_create_mensaje(
    body: MensajeCreate,
    session: Session = Depends(get_session),
):
    # Antes esto recibía un dict sin tipar y accedía con body["..."]: una clave
    # faltante era un 500, y no se validaba el número. Por acá entraron las
    # filas con el texto del mensaje en la columna del teléfono.
    whatsapp = normalizar_whatsapp(body.lead_whatsapp)

    # La FK exige que el lead exista. En el workflow "Upsert lead backend1" corre
    # antes que el guardado del mensaje, así que llegar acá sin lead significa
    # que el orden se rompió: mejor un 404 explícito que un IntegrityError 500.
    if not session.exec(select(Lead).where(Lead.whatsapp == whatsapp)).first():
        raise HTTPException(
            status_code=404,
            detail=f"No existe el lead {whatsapp}: hay que hacer el upsert antes de guardar el mensaje",
        )

    cinco_min_atras = datetime.utcnow() - timedelta(minutes=5)

    # Si es LEAD y ya existe un BOT con mismo texto en últimos 30s → feedback loop, ignorar
    if body.origen == "LEAD":
        echo = session.exec(
            select(Mensaje).where(
                Mensaje.lead_whatsapp == whatsapp,
                Mensaje.origen == "BOT",
                Mensaje.mensaje == body.mensaje,
                Mensaje.fecha_hora >= datetime.utcnow() - timedelta(seconds=30),
            )
        ).first()
        if echo:
            return echo

    existente = session.exec(
        select(Mensaje).where(
            Mensaje.lead_whatsapp == whatsapp,
            Mensaje.origen == body.origen,
            Mensaje.mensaje == body.mensaje,
            Mensaje.fecha_hora >= cinco_min_atras,
        )
    ).first()
    if existente:
        return existente
    mensaje = Mensaje(
        lead_whatsapp=whatsapp,
        origen=body.origen,
        mensaje=body.mensaje,
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


@router.get("/lead-fields/prompt", response_class=Response)
def n8n_lead_fields_prompt(session: Session = Depends(get_session)):
    """La lista de datos que el bot tiene que recopilar, para el system prompt.

    Reemplaza el bloque que antes estaba escrito a mano en el systemMessage del
    AI Agent: agregar un campo desde la UI ahora cambia el prompt sin tocar n8n.
    """
    campos = session.exec(
        select(CampoLead)
        .where(CampoLead.activo == True, CampoLead.pide_el_bot == True)  # noqa: E712
        .order_by(CampoLead.orden.asc())
    ).all()

    lineas = []
    for c in campos:
        # Las opciones son la guía más fuerte para el modelo; si no hay, va la
        # descripción; si no hay ninguna, al menos la etiqueta.
        if c.opciones:
            guia = " / ".join(o.strip() for o in c.opciones.split(",") if o.strip())
        else:
            guia = c.descripcion or c.etiqueta
        lineas.append(f"- {c.clave}: {guia}")

    return Response(content="\n".join(lineas), media_type="text/plain")


@router.get("/lead/{whatsapp}/resumen", response_class=Response)
def n8n_lead_resumen(whatsapp: str, session: Session = Depends(get_session)):
    """Notificación al encargado, ya formateada.

    Antes el texto se armaba en el nodo "Preparar textos cierre" con las
    etiquetas y emojis a mano, así que un campo nuevo no aparecía nunca.
    """
    lead = session.exec(select(Lead).where(Lead.whatsapp == whatsapp)).first()
    if not lead:
        return Response(content="", media_type="text/plain")

    campos = session.exec(select(CampoLead).order_by(CampoLead.orden.asc())).all()
    datos = lead.datos or {}

    lineas = [
        "🔥 Lead listo para cerrar:",
        f"👤 {lead.nombre}",
        f"📱 {lead.whatsapp}",
    ]
    # Se recorren todos los campos, no solo los activos: si un dato quedó
    # cargado en un campo que se desactivó, sigue siendo información útil.
    for c in campos:
        valor = datos.get(c.clave)
        if valor not in (None, ""):
            lineas.append(f"{c.etiqueta}: {valor}")

    return Response(content="\n".join(lineas), media_type="text/plain")
