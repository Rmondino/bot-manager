from datetime import datetime

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.config.model import BotConfig
from app.config.schema import BotConfigUpdate, BotConfigResponse

router = APIRouter(prefix="/config", tags=["config"])


def _get_or_create_default(session: Session) -> BotConfig:
    config = session.exec(select(BotConfig).limit(1)).first()
    if not config:
        config = BotConfig()
        session.add(config)
        session.commit()
        session.refresh(config)
    return config


@router.get("/", response_model=BotConfigResponse)
def get_config(session: Session = Depends(get_session)):
    config = _get_or_create_default(session)
    return config


@router.put("/", response_model=BotConfigResponse)
def update_config(body: BotConfigUpdate, session: Session = Depends(get_session)):
    config = _get_or_create_default(session)
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    config.updated_at = datetime.utcnow()
    session.add(config)
    session.commit()
    session.refresh(config)
    return config
