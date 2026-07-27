from fastapi import APIRouter

router = APIRouter(prefix="/mensajes", tags=["Mensajes"])


@router.get("/")
def list_mensajes():
    return {"router": "mensajes"}
