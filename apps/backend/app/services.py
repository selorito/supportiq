from __future__ import annotations

import json
import logging
import time
from datetime import UTC, datetime, timedelta

import pika
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .config import settings
from .database import engine
from .models import AgentNote, Ticket, TicketAnalysis, TicketEmbedding, TicketEvent
from .schemas import (
    AgentNoteCreate,
    AssistantAnswerRead,
    CurrentUserRead,
    DashboardSummary,
    SimilarTicketRead,
    TicketCreate,
    TicketDetailResponse,
)
from supportiq_common import TicketAnalyzer

logger = logging.getLogger(__name__)
analyzer = TicketAnalyzer()

DEMO_TICKETS = [
    TicketCreate(
        subject="Kargom gecikti, iade talep ediyorum",
        message="Beş gün önce sipariş verdim, ürün hâlâ ulaşmadı ve ücret iadesi talep ediyorum.",
        customer_name="Ayse Demir",
        customer_email="ayse.demir@example.com",
        source="web_form",
    ),
    TicketCreate(
        subject="Uygulama girişte çöküyor",
        message="Son sürümden sonra ekibimiz sisteme giriş yapamıyor. Uygulama hata verip kapanıyor.",
        customer_name="Mert Kaya",
        customer_email="mert.kaya@example.com",
        source="api",
    ),
    TicketCreate(
        subject="Kurumsal paket için fiyat bilgisi istiyoruz",
        message="Kurumsal paketinizi değerlendiriyoruz. Fiyat, SLA ve onboarding süreci hakkında bilgi rica ediyoruz.",
        customer_name="Elif Arslan",
        customer_email="elif.arslan@example.com",
        source="email",
    ),
]


def create_ticket(db: Session, payload: TicketCreate, current_user: CurrentUserRead) -> Ticket:
    ticket_data = payload.model_dump()
    if current_user.role == "customer":
        ticket_data["customer_name"] = current_user.name
        ticket_data["customer_email"] = current_user.email
        ticket_data["source"] = payload.source or "web_form"

    ticket = Ticket(**ticket_data)
    db.add(ticket)
    db.flush()

    db.add(
        TicketEvent(
            ticket_id=ticket.id,
            event_type="ticket_created",
            payload=json.dumps({"source": ticket.source, "requester_role": current_user.role, "customer_email": ticket.customer_email}),
        )
    )
    db.commit()
    db.refresh(ticket)
    publish_ticket_created(ticket.id)
    return ticket


def list_tickets(db: Session, current_user: CurrentUserRead) -> list[Ticket]:
    stmt = (
        select(Ticket)
        .options(selectinload(Ticket.analysis))
        .order_by(Ticket.created_at.desc())
    )
    stmt = _apply_ticket_scope(stmt, current_user)
    return list(db.scalars(stmt).all())


def get_ticket(db: Session, ticket_id: int, current_user: CurrentUserRead) -> Ticket | None:
    stmt = (
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(selectinload(Ticket.analysis), selectinload(Ticket.events), selectinload(Ticket.notes))
    )
    stmt = _apply_ticket_scope(stmt, current_user)
    return db.scalar(stmt)


def get_ticket_detail(db: Session, ticket_id: int, current_user: CurrentUserRead) -> TicketDetailResponse | None:
    ticket = get_ticket(db, ticket_id, current_user)
    if not ticket:
        return None

    similar_tickets = find_similar_tickets(db, ticket_id, current_user)
    return TicketDetailResponse(
        **{
            field: getattr(ticket, field)
            for field in [
                "id",
                "subject",
                "message",
                "customer_name",
                "customer_email",
                "source",
                "status",
                "first_response_at",
                "resolved_at",
                "response_due_at",
                "resolution_due_at",
                "created_at",
                "updated_at",
                "analysis",
                "events",
                "notes",
                "ai_status",
            ]
        },
        similar_tickets=similar_tickets,
        sla_status=get_ticket_sla_status(ticket),
    )


def update_ticket_status(db: Session, ticket: Ticket, status: str) -> Ticket:
    ticket.status = status
    if status == "resolved":
        ticket.resolved_at = datetime.now(UTC)
    db.add(
        TicketEvent(
            ticket_id=ticket.id,
            event_type="status_changed",
            payload=json.dumps({"status": status}),
        )
    )
    db.commit()
    db.refresh(ticket)
    return ticket


def request_ticket_reanalysis(db: Session, ticket: Ticket) -> Ticket:
    db.add(
        TicketEvent(
            ticket_id=ticket.id,
            event_type="ai_reanalysis_requested",
            payload=json.dumps({"ticket_id": ticket.id}),
        )
    )
    db.commit()
    db.refresh(ticket)
    publish_ticket_created(ticket.id)
    return ticket


def answer_ticket_assistant(db: Session, ticket: Ticket, question: str) -> AssistantAnswerRead:
    analysis_payload = None
    if ticket.analysis:
        analysis_payload = {
            "category": ticket.analysis.category,
            "priority": ticket.analysis.priority,
            "sentiment": ticket.analysis.sentiment,
            "summary": ticket.analysis.summary,
            "explanation": ticket.analysis.explanation,
            "assigned_team": ticket.analysis.assigned_team,
            "suggested_reply": ticket.analysis.suggested_reply,
            "confidence_score": ticket.analysis.confidence_score,
            "model_source": ticket.analysis.model_source,
        }

    answer, model_source = analyzer.answer_question(ticket.subject, ticket.message, analysis_payload, question)
    db.add(
        TicketEvent(
            ticket_id=ticket.id,
            event_type="ai_assistant_answered",
            payload=json.dumps({"question": question, "model_source": model_source}),
        )
    )
    db.commit()
    return AssistantAnswerRead(answer=answer, model_source=model_source)


def build_dashboard_summary(db: Session, current_user: CurrentUserRead) -> DashboardSummary:
    total_tickets = _count_tickets(db, current_user)
    open_tickets = _count_tickets(db, current_user, Ticket.status != "resolved")
    resolved_tickets = _count_tickets(db, current_user, Ticket.status == "resolved")
    analyzed_tickets = _count_analyses(db, current_user)

    category_distribution = _distribution(db, TicketAnalysis.category, current_user)
    priority_distribution = _distribution(db, TicketAnalysis.priority, current_user)
    sentiment_distribution = _distribution(db, TicketAnalysis.sentiment, current_user)
    team_distribution = _distribution(db, TicketAnalysis.assigned_team, current_user)
    model_source_distribution = _distribution(db, TicketAnalysis.model_source, current_user)
    sla_breached_tickets = sum(1 for ticket in list_tickets(db, current_user) if get_ticket_sla_status(ticket) == "breached")
    sla_breach_rate = round((sla_breached_tickets / total_tickets) * 100, 2) if total_tickets else 0.0

    return DashboardSummary(
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        resolved_tickets=resolved_tickets,
        analyzed_tickets=analyzed_tickets,
        category_distribution=category_distribution,
        priority_distribution=priority_distribution,
        sentiment_distribution=sentiment_distribution,
        team_distribution=team_distribution,
        model_source_distribution=model_source_distribution,
        sla_breached_tickets=sla_breached_tickets,
        sla_breach_rate=sla_breach_rate,
    )


def seed_demo_tickets(db: Session, current_user: CurrentUserRead) -> list[Ticket]:
    existing_count = db.scalar(select(func.count(Ticket.id))) or 0
    if existing_count > 0:
        return []

    created: list[Ticket] = []
    for payload in DEMO_TICKETS:
        created.append(create_ticket(db, payload, current_user))
    return created


def add_agent_note(db: Session, ticket: Ticket, payload: AgentNoteCreate) -> AgentNote:
    note = AgentNote(ticket_id=ticket.id, author_name=payload.author_name, body=payload.body)
    db.add(note)
    if ticket.first_response_at is None:
        ticket.first_response_at = datetime.now(UTC)
    db.add(
        TicketEvent(
            ticket_id=ticket.id,
            event_type="note_added",
            payload=json.dumps({"author_name": payload.author_name, "body": payload.body}),
        )
    )
    db.commit()
    db.refresh(note)
    return note


def upsert_ticket_embedding(db: Session, ticket_id: int, text: str) -> None:
    vector = analyzer.embed_text(text)
    model_name = analyzer.embedding_model if analyzer.client else "hashing"
    existing = db.scalar(select(TicketEmbedding).where(TicketEmbedding.ticket_id == ticket_id))
    if existing:
        existing.vector_json = json.dumps(vector)
        existing.model_name = model_name
    else:
        db.add(TicketEmbedding(ticket_id=ticket_id, vector_json=json.dumps(vector), model_name=model_name))


def find_similar_tickets(db: Session, ticket_id: int, current_user: CurrentUserRead, limit: int = 3) -> list[SimilarTicketRead]:
    if current_user.role != "agent":
        return []

    base_embedding = db.scalar(select(TicketEmbedding).where(TicketEmbedding.ticket_id == ticket_id))
    base_ticket = db.scalar(select(Ticket).where(Ticket.id == ticket_id))
    if not base_embedding or not base_ticket:
        return []

    base_vector = json.loads(base_embedding.vector_json)
    rows = db.execute(
        select(TicketEmbedding, Ticket, TicketAnalysis)
        .join(Ticket, Ticket.id == TicketEmbedding.ticket_id)
        .outerjoin(TicketAnalysis, TicketAnalysis.ticket_id == Ticket.id)
        .where(Ticket.id != ticket_id)
    ).all()

    scored: list[SimilarTicketRead] = []
    for embedding, ticket, analysis in rows:
        similarity = analyzer.cosine_similarity(base_vector, json.loads(embedding.vector_json))
        scored.append(
            SimilarTicketRead(
                ticket_id=ticket.id,
                subject=ticket.subject,
                category=analysis.category if analysis else None,
                similarity_score=round(similarity, 4),
                status=ticket.status,
            )
        )
    scored.sort(key=lambda item: item.similarity_score, reverse=True)
    return scored[:limit]


def compute_sla(priority: str) -> tuple[timedelta, timedelta]:
    if priority == "high":
        return timedelta(hours=1), timedelta(hours=8)
    if priority == "low":
        return timedelta(hours=8), timedelta(hours=72)
    return timedelta(hours=4), timedelta(hours=24)


def apply_sla(ticket: Ticket, priority: str) -> None:
    response_window, resolution_window = compute_sla(priority)
    created_at = ticket.created_at or datetime.now(UTC)
    ticket.response_due_at = created_at + response_window
    ticket.resolution_due_at = created_at + resolution_window


def get_ticket_sla_status(ticket: Ticket) -> str:
    now = datetime.now(UTC)
    if ticket.resolved_at and ticket.resolution_due_at and ticket.resolved_at > ticket.resolution_due_at:
        return "breached"
    if ticket.first_response_at and ticket.response_due_at and ticket.first_response_at > ticket.response_due_at:
        return "breached"
    if ticket.resolution_due_at and ticket.status != "resolved" and now > ticket.resolution_due_at:
        return "breached"
    if ticket.response_due_at and ticket.first_response_at is None and now > ticket.response_due_at:
        return "at_risk"
    return "healthy"


def wait_for_database(max_attempts: int = 20, delay_seconds: float = 2.0) -> None:
    last_error: Exception | None = None
    for _ in range(max_attempts):
        try:
            with engine.connect() as connection:
                connection.exec_driver_sql("SELECT 1")
            return
        except Exception as exc:
            last_error = exc
            time.sleep(delay_seconds)
    if last_error:
        raise last_error


def ensure_runtime_schema() -> None:
    statements = [
        "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ",
        "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ",
        "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS response_due_at TIMESTAMPTZ",
        "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_due_at TIMESTAMPTZ",
        "ALTER TABLE ticket_analysis ADD COLUMN IF NOT EXISTS model_source VARCHAR(50) DEFAULT 'rules'",
        "ALTER TABLE ticket_analysis ADD COLUMN IF NOT EXISTS explanation TEXT DEFAULT ''",
        """
        CREATE TABLE IF NOT EXISTS ticket_embeddings (
            id SERIAL PRIMARY KEY,
            ticket_id INTEGER UNIQUE REFERENCES tickets(id),
            vector_json TEXT NOT NULL,
            model_name VARCHAR(100) NOT NULL DEFAULT 'hashing',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS agent_notes (
            id SERIAL PRIMARY KEY,
            ticket_id INTEGER REFERENCES tickets(id),
            author_name VARCHAR(120) NOT NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        """,
    ]
    with engine.begin() as connection:
        for statement in statements:
            connection.exec_driver_sql(statement)


def publish_ticket_created(ticket_id: int) -> None:
    try:
        parameters = pika.URLParameters(settings.rabbitmq_url)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        channel.queue_declare(queue=settings.queue_name, durable=True)
        channel.basic_publish(
            exchange="",
            routing_key=settings.queue_name,
            body=json.dumps({"ticket_id": ticket_id}),
            properties=pika.BasicProperties(delivery_mode=2),
        )
        connection.close()
    except Exception as exc:
        logger.warning("Failed to publish ticket_created event for ticket %s: %s", ticket_id, exc)


def _apply_ticket_scope(stmt, current_user: CurrentUserRead):
    if current_user.role == "customer":
        stmt = stmt.where(Ticket.customer_email == current_user.email)
    return stmt


def _count_tickets(db: Session, current_user: CurrentUserRead, *conditions) -> int:
    stmt = select(func.count(Ticket.id))
    if current_user.role == "customer":
        stmt = stmt.where(Ticket.customer_email == current_user.email)
    for condition in conditions:
        stmt = stmt.where(condition)
    return db.scalar(stmt) or 0


def _count_analyses(db: Session, current_user: CurrentUserRead) -> int:
    stmt = select(func.count(TicketAnalysis.id)).select_from(TicketAnalysis).join(Ticket, Ticket.id == TicketAnalysis.ticket_id)
    if current_user.role == "customer":
        stmt = stmt.where(Ticket.customer_email == current_user.email)
    return db.scalar(stmt) or 0


def _distribution(db: Session, column, current_user: CurrentUserRead) -> dict[str, int]:
    stmt = select(column, func.count()).select_from(TicketAnalysis).join(Ticket, Ticket.id == TicketAnalysis.ticket_id)
    if current_user.role == "customer":
        stmt = stmt.where(Ticket.customer_email == current_user.email)
    rows = db.execute(stmt.group_by(column)).all()
    return {key or "unknown": value for key, value in rows}
