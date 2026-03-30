from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_agent
from ..database import get_db
from ..schemas import CurrentUserRead, DashboardSummary
from ..services import build_dashboard_summary, seed_demo_tickets

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(current_user: CurrentUserRead = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_dashboard_summary(db, current_user)


@router.post("/seed")
def seed_demo_data(agent: CurrentUserRead = Depends(require_agent), db: Session = Depends(get_db)):
    created = seed_demo_tickets(db, agent)
    return {"created": len(created)}
