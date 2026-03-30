from app.schemas import AgentNoteCreate, TicketCreate


def test_ticket_create_schema_defaults_source():
    payload = TicketCreate(
        subject="Login problem",
        message="The app crashes on login.",
        customer_name="Jane Doe",
        customer_email="jane@example.com",
    )

    assert payload.source == "web_form"


def test_agent_note_create_schema():
    note = AgentNoteCreate(author_name="Agent", body="Escalated to finance.")

    assert note.author_name == "Agent"
    assert "finance" in note.body
