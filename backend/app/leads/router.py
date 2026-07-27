from fastapi import APIRouter

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.get("/")
def list_leads():
    return {"router": "leads"}
