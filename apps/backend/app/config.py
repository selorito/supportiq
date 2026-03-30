from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SupportIQ API"
    api_prefix: str = "/api"
    database_url: str = "postgresql+psycopg://supportiq:supportiq@db:5432/supportiq"
    rabbitmq_url: str = "amqp://guest:guest@rabbitmq:5672/"
    queue_name: str = "ticket_created"
    cors_origins: str = "http://localhost:5173"
    auth_secret: str = "supportiq-dev-secret"
    auth_token_ttl_hours: int = 24

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
