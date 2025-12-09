from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Production Optimization"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    # Default to sqlite for local dev; production should set DATABASE_URL to a Postgres URL
    DATABASE_URL: str = "sqlite:///./production.db"

    class Config:
        env_file = ".env"


settings = Settings()
