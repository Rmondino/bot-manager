from fastapi import APIRouter

router = APIRouter(prefix="/n8n", tags=["n8n"])


@router.get("/")
def n8n_status():
    return {"router": "n8n"}
