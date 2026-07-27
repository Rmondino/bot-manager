from fastapi import APIRouter

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


@router.get("/")
def whatsapp_status():
    return {"router": "whatsapp"}
