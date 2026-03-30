from __future__ import annotations

import json
import time
from datetime import UTC, datetime

import pika
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from supportiq_common import TicketAnalyzer
from app.models import Ticket, TicketAnalysis, TicketEvent
from app.services import apply_sla, upsert_ticket_embedding, wait_for_database


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://supportiq:supportiq@db:5432/supportiq"
    rabbitmq_url: str = "amqp://guest:guest@rabbitmq:5672/"
    queue_name: str = "ticket_created"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
engine = create_engine(settings.database_url, future=True)
analyzer = TicketAnalyzer()


def process_message(body: bytes) -> None:
    payload = json.loads(body.decode("utf-8"))
    ticket_id = payload["ticket_id"]

    with Session(engine) as session:
        ticket = session.scalar(select(Ticket).where(Ticket.id == ticket_id))
        if not ticket:
            return

        result = analyzer.analyze(ticket.subject, ticket.message)
        existing = session.scalar(select(TicketAnalysis).where(TicketAnalysis.ticket_id == ticket_id))
        if existing:
            existing.category = result.category
            existing.priority = result.priority
            existing.sentiment = result.sentiment
            existing.summary = result.summary
            existing.explanation = result.explanation
            existing.assigned_team = result.assigned_team
            existing.suggested_reply = result.suggested_reply
            existing.confidence_score = result.confidence_score
            existing.model_source = result.model_source
        else:
            session.add(
                TicketAnalysis(
                    ticket_id=ticket_id,
                    category=result.category,
                    priority=result.priority,
                    sentiment=result.sentiment,
                    summary=result.summary,
                    explanation=result.explanation,
                    assigned_team=result.assigned_team,
                    suggested_reply=result.suggested_reply,
                    confidence_score=result.confidence_score,
                    model_source=result.model_source,
                )
            )

        if ticket.first_response_at is None:
            ticket.first_response_at = datetime.now(UTC)
        apply_sla(ticket, result.priority)
        upsert_ticket_embedding(session, ticket_id, f"{ticket.subject}\n{ticket.message}")

        session.add(
            TicketEvent(
                ticket_id=ticket_id,
                event_type="ticket_analyzed",
                payload=result.model_dump_json(),
            )
        )
        if ticket.status == "new":
            ticket.status = "triaged"
        session.commit()


def run() -> None:
    wait_for_database()
    while True:
        try:
            parameters = pika.URLParameters(settings.rabbitmq_url)
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()
            channel.queue_declare(queue=settings.queue_name, durable=True)
            channel.basic_qos(prefetch_count=1)

            def callback(ch, method, _properties, body):
                process_message(body)
                ch.basic_ack(delivery_tag=method.delivery_tag)

            channel.basic_consume(queue=settings.queue_name, on_message_callback=callback)
            channel.start_consuming()
        except Exception:
            time.sleep(5)


if __name__ == "__main__":
    run()
