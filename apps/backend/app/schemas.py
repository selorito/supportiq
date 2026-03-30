from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CurrentUserRead(BaseModel):
    name: str
    email: EmailStr
    role: str


class AuthTokenRead(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: CurrentUserRead


class TicketCreate(BaseModel):
    subject: str
    message: str
    customer_name: str
    customer_email: EmailStr
    source: str = "web_form"


class TicketUpdateStatus(BaseModel):
    status: str


class AgentNoteCreate(BaseModel):
    author_name: str
    body: str


class TicketEventRead(BaseModel):
    id: int
    event_type: str
    payload: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketAnalysisRead(BaseModel):
    category: str
    priority: str
    sentiment: str
    summary: str
    explanation: str
    assigned_team: str
    suggested_reply: str
    confidence_score: float
    model_source: str
    analyzed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketRead(BaseModel):
    id: int
    subject: str
    message: str
    customer_name: str
    customer_email: EmailStr
    source: str
    status: str
    first_response_at: datetime | None = None
    resolved_at: datetime | None = None
    response_due_at: datetime | None = None
    resolution_due_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None
    analysis: TicketAnalysisRead | None = None
    ai_status: str

    model_config = ConfigDict(from_attributes=True)


class AgentNoteRead(BaseModel):
    id: int
    ticket_id: int
    author_name: str
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketDetailRead(TicketRead):
    events: list[TicketEventRead] = Field(default_factory=list)
    notes: list[AgentNoteRead] = Field(default_factory=list)


class SimilarTicketRead(BaseModel):
    ticket_id: int
    subject: str
    category: str | None = None
    similarity_score: float
    status: str


class TicketDetailResponse(TicketDetailRead):
    similar_tickets: list[SimilarTicketRead] = Field(default_factory=list)
    sla_status: str


class DashboardSummary(BaseModel):
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    analyzed_tickets: int
    category_distribution: dict[str, int]
    priority_distribution: dict[str, int]
    sentiment_distribution: dict[str, int]
    team_distribution: dict[str, int]
    model_source_distribution: dict[str, int]
    sla_breached_tickets: int
    sla_breach_rate: float


class AssistantQuestionCreate(BaseModel):
    question: str


class AssistantAnswerRead(BaseModel):
    answer: str
    model_source: str
