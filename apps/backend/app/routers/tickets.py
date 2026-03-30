from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_agent
from ..database import get_db
from ..schemas import (
    AgentNoteCreate,
    AgentNoteRead,
    AssistantAnswerRead,
    AssistantQuestionCreate,
    CurrentUserRead,
    TicketCreate,
    TicketDetailResponse,
    TicketRead,
    TicketUpdateStatus,
)
from ..services import (
    add_agent_note,
    answer_ticket_assistant,
    create_ticket,
    get_ticket,
    get_ticket_detail,
    list_tickets,
    request_ticket_reanalysis,
    update_ticket_status,
)

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post("", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
def create_ticket_endpoint(
    payload: TicketCreate,
    current_user: CurrentUserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_ticket(db, payload, current_user)


@router.get("", response_model=list[TicketRead])
def list_tickets_endpoint(current_user: CurrentUserRead = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_tickets(db, current_user)


@router.get("/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket_endpoint(ticket_id: int, current_user: CurrentUserRead = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = get_ticket_detail(db, ticket_id, current_user)
    if not ticket:
        raise HTTPException(status_code=404, detail="Talep bulunamadı")
    return ticket


@router.patch("/{ticket_id}/status", response_model=TicketRead)
def update_ticket_status_endpoint(
    ticket_id: int,
    payload: TicketUpdateStatus,
    _agent: CurrentUserRead = Depends(require_agent),
    db: Session = Depends(get_db),
):
    ticket = get_ticket(db, ticket_id, _agent)
    if not ticket:
        raise HTTPException(status_code=404, detail="Talep bulunamadı")
    return update_ticket_status(db, ticket, payload.status)


@router.post("/{ticket_id}/notes", response_model=AgentNoteRead, status_code=status.HTTP_201_CREATED)
def add_note_endpoint(
    ticket_id: int,
    payload: AgentNoteCreate,
    agent: CurrentUserRead = Depends(require_agent),
    db: Session = Depends(get_db),
):
    ticket = get_ticket(db, ticket_id, agent)
    if not ticket:
        raise HTTPException(status_code=404, detail="Talep bulunamadı")
    return add_agent_note(db, ticket, payload)


@router.post("/{ticket_id}/reanalyze", response_model=TicketRead)
def reanalyze_ticket_endpoint(ticket_id: int, agent: CurrentUserRead = Depends(require_agent), db: Session = Depends(get_db)):
    ticket = get_ticket(db, ticket_id, agent)
    if not ticket:
        raise HTTPException(status_code=404, detail="Talep bulunamadı")
    return request_ticket_reanalysis(db, ticket)


@router.post("/{ticket_id}/assistant", response_model=AssistantAnswerRead)
def assistant_question_endpoint(
    ticket_id: int,
    payload: AssistantQuestionCreate,
    agent: CurrentUserRead = Depends(require_agent),
    db: Session = Depends(get_db),
):
    ticket = get_ticket(db, ticket_id, agent)
    if not ticket:
        raise HTTPException(status_code=404, detail="Talep bulunamadı")
    return answer_ticket_assistant(db, ticket, payload.question)
