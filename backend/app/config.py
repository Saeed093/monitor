from pathlib import Path
from urllib.parse import unquote

from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/monitor"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/monitor"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen3:8b"

    # X (Twitter) API v2 — pay-per-use; get Bearer Token at developer.x.com
    X_BEARER_TOKEN: str = ""

    # Facebook Graph API — create an app at developers.facebook.com
    FB_ACCESS_TOKEN: str = ""
    FB_PAGE_IDS: str = ""  # comma-separated page IDs

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("X_BEARER_TOKEN", "FB_ACCESS_TOKEN", mode="before")
    @classmethod
    def strip_token(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip().strip('"').strip("'")
        return v

    @computed_field
    @property
    def x_bearer_token_normalized(self) -> str:
        """Decode URL-encoded secrets (e.g. %3D -> =) and trim."""
        if not self.X_BEARER_TOKEN:
            return ""
        return unquote(self.X_BEARER_TOKEN).strip()


settings = Settings()
