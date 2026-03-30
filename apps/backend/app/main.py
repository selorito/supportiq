from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import decode_access_token
from .config import settings
from .database import Base, SessionLocal, engine
from .models import Ticket, TicketEvent
from .routers import auth, dashboard, tickets
from .schemas import CurrentUserRead
from .services import ensure_runtime_schema, wait_for_database


class WebSocketHub:
    def __init__(self) -> None:
        self.connections: dict[WebSocket, CurrentUserRead] = {}

    async def connect(self, websocket: WebSocket, user: CurrentUserRead) -> None:
        await websocket.accept()
        self.connections[websocket] = user

    def disconnect(self, websocket: WebSocket) -> None:
        self.connections.pop(websocket, None)

    async def broadcast(self, payload: dict, ticket_email: str) -> None:
        stale: list[WebSocket] = []
        for connection, user in self.connections.items():
            if user.role != "agent" and user.email != ticket_email:
                continue
            try:
                await connection.send_json(payload)
            except Exception:
                stale.append(connection)
        for connection in stale:
            self.disconnect(connection)


hub = WebSocketHub()
last_event_id = 0


async def poll_ticket_events() -> None:
    global last_event_id
    while True:
        with SessionLocal() as session:
            rows = session.execute(
                select(TicketEvent, Ticket.customer_email)
                .join(Ticket, Ticket.id == TicketEvent.ticket_id)
                .where(TicketEvent.id > last_event_id)
                .order_by(TicketEvent.id.asc())
            ).all()
            for event, customer_email in rows:
                last_event_id = max(last_event_id, event.id)
                await hub.broadcast(
                    {
                        "type": event.event_type,
                        "ticket_id": event.ticket_id,
                        "payload": event.payload,
                        "created_at": event.created_at.isoformat() if event.created_at else None,
                    },
                    customer_email,
                )
        await asyncio.sleep(1)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    wait_for_database()
    Base.metadata.create_all(bind=engine)
    ensure_runtime_schema()
    task = asyncio.create_task(poll_ticket_events())
    yield
    task.cancel()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(tickets.router, prefix=settings.api_prefix)
app.include_router(dashboard.router, prefix=settings.api_prefix)


@app.get("/health")
def healthcheck():
    return {"status": "ok"}


@app.websocket("/ws/tickets")
async def ticket_events_websocket(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return
    try:
        user = decode_access_token(token)
    except Exception:
        await websocket.close(code=4401)
        return

    await hub.connect(websocket, user)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        hub.disconnect(websocket)
