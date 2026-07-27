from fastapi import APIRouter

router = APIRouter(prefix="/config", tags=["Config"])


@router.get("/")
def list_config():
    return {"router": "config"}
