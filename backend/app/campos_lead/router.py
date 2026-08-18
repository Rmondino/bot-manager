from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlmodel import Session, select

from app.database import get_session
from app.campos_lead.model import CampoLead
from app.campos_lead.schema import (
    CampoLeadCreate,
    CampoLeadResponse,
    CampoLeadUpdate,
    LeadConDato,
    UsoCampo,
)
from app.leads.model import Lead

router = APIRouter(prefix="/campos-lead", tags=["campos-lead"])

# Cuántos leads listar en el detalle de uso. El total va aparte.
MAX_LEADS_EN_USO = 20


@router.get("/", response_model=List[CampoLeadResponse])
def list_campos(session: Session = Depends(get_session)):
    return session.exec(select(CampoLead).order_by(CampoLead.orden.asc())).all()


@router.get("/{id}/uso", response_model=UsoCampo)
def uso_campo(id: int, session: Session = Depends(get_session)):
    """Qué leads perderían su dato si se borra este campo.

    Devuelve la lista y no solo el conteo: antes de una purga irreversible hay
    que poder ver a qué números afecta.
    """
    campo = session.get(CampoLead, id)
    if not campo:
        raise HTTPException(status_code=404, detail="Campo not found")

    filas = session.exec(
        select(Lead.nombre, Lead.whatsapp, Lead.datos[campo.clave].astext)
        .where(Lead.datos.has_key(campo.clave))  # noqa: W601 — operador ? de JSONB
        .order_by(Lead.id.asc())
    ).all()

    return UsoCampo(
        total=len(filas),
        leads=[
            LeadConDato(nombre=n, whatsapp=w, valor=v)
            for n, w, v in filas[:MAX_LEADS_EN_USO]
        ],
    )


@router.get("/{id}", response_model=CampoLeadResponse)
def get_campo(id: int, session: Session = Depends(get_session)):
    campo = session.get(CampoLead, id)
    if not campo:
        raise HTTPException(status_code=404, detail="Campo not found")
    return campo


@router.post("/", response_model=CampoLeadResponse, status_code=201)
def create_campo(body: CampoLeadCreate, session: Session = Depends(get_session)):
    existente = session.exec(
        select(CampoLead).where(CampoLead.clave == body.clave)
    ).first()
    if existente:
        raise HTTPException(
            status_code=409, detail=f"Ya existe un campo con la clave '{body.clave}'"
        )
    campo = CampoLead(**body.model_dump())
    session.add(campo)
    session.commit()
    session.refresh(campo)
    return campo


@router.put("/{id}", response_model=CampoLeadResponse)
def update_campo(
    id: int,
    body: CampoLeadUpdate,
    session: Session = Depends(get_session),
):
    """`clave` no se puede cambiar: CampoLeadUpdate directamente no la acepta."""
    campo = session.get(CampoLead, id)
    if not campo:
        raise HTTPException(status_code=404, detail="Campo not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(campo, field, value)
    session.add(campo)
    session.commit()
    session.refresh(campo)
    return campo


@router.delete("/{id}")
def delete_campo(id: int, session: Session = Depends(get_session)):
    """Borra el campo y purga su valor de todos los leads.

    Es la acción destructiva: para dejar de pedir un dato sin perder el
    historial está `activo=false`.
    """
    campo = session.get(CampoLead, id)
    if not campo:
        raise HTTPException(status_code=404, detail="Campo not found")

    resultado = session.execute(
        text("UPDATE leads SET datos = datos - :clave WHERE datos ? :clave"),
        {"clave": campo.clave},
    )
    leads_afectados = resultado.rowcount or 0
    session.delete(campo)
    session.commit()
    return {"ok": True, "leads_afectados": leads_afectados}
