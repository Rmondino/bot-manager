from fastapi import APIRouter

router = APIRouter(prefix="/company-info", tags=["Company Info"])


@router.get("/")
def get_company_info():
    return {"router": "company_info"}
