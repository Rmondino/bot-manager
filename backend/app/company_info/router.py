from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select

from app.database import get_session
from app.company_info.model import CompanyInfo
from app.company_info.schema import CompanyInfoCreate, CompanyInfoUpdate, CompanyInfoResponse

router = APIRouter(prefix="/company-info", tags=["company-info"])


@router.get("/", response_model=List[CompanyInfoResponse])
def list_company_info(session: Session = Depends(get_session)):
    items = session.exec(select(CompanyInfo).order_by(CompanyInfo.orden.asc())).all()
    return items


@router.get("/prompt", response_class=Response)
def get_company_info_prompt(session: Session = Depends(get_session)):
    items = session.exec(select(CompanyInfo).order_by(CompanyInfo.orden.asc())).all()
    texto = "\n\n".join(f"P: {e.pregunta}\nR: {e.respuesta}" for e in items)
    return Response(content=texto, media_type="text/plain")


@router.get("/{id}", response_model=CompanyInfoResponse)
def get_company_info_item(id: int, session: Session = Depends(get_session)):
    item = session.get(CompanyInfo, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("/", response_model=CompanyInfoResponse, status_code=201)
def create_company_info(body: CompanyInfoCreate, session: Session = Depends(get_session)):
    item = CompanyInfo(
        pregunta=body.pregunta,
        respuesta=body.respuesta,
        orden=body.orden,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.put("/{id}", response_model=CompanyInfoResponse)
def update_company_info(id: int, body: CompanyInfoUpdate, session: Session = Depends(get_session)):
    item = session.get(CompanyInfo, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.delete("/{id}")
def delete_company_info(id: int, session: Session = Depends(get_session)):
    item = session.get(CompanyInfo, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    return {"ok": True}
