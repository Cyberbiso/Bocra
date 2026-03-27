from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = Field(default="BOCRA Platform API", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    debug: bool = Field(default=False, alias="DEBUG")
    api_prefix: str = Field(default="/api", alias="API_PREFIX")
    allowed_origins: str = Field(default="http://localhost:3000", alias="ALLOWED_ORIGINS")

    database_url: str = Field(
        default=f"sqlite:///{(BACKEND_DIR / 'bocra_dev.db').as_posix()}",
        alias="DATABASE_URL",
    )
    seed_demo_data: bool = Field(default=True, alias="SEED_DEMO_DATA")
    storage_dir: Path = Field(default=BACKEND_DIR / ".storage", alias="STORAGE_DIR")

    session_cookie_name: str = Field(default="bocra-session", alias="SESSION_COOKIE_NAME")
    session_ttl_hours: int = Field(default=24, alias="SESSION_TTL_HOURS")
    local_auth_salt: str = Field(default="bocra-demo-salt", alias="LOCAL_AUTH_SALT")

    supabase_url: str = Field(default="", alias="SUPABASE_URL")
    supabase_anon_key: str = Field(default="", alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(default="", alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_storage_bucket: str = Field(default="bocra-files", alias="SUPABASE_STORAGE_BUCKET")

    google_api_key: str = Field(default="", alias="GOOGLE_API_KEY")
    google_ai_model: str = Field(default="gemini-2.5-flash", alias="GOOGLE_AI_MODEL")
    google_adk_use_vertexai: bool = Field(default=False, alias="GOOGLE_ADK_USE_VERTEXAI")
    google_cloud_project: str = Field(default="", alias="GOOGLE_CLOUD_PROJECT")
    google_cloud_location: str = Field(default="us-central1", alias="GOOGLE_CLOUD_LOCATION")
    google_application_credentials: str = Field(default="", alias="GOOGLE_APPLICATION_CREDENTIALS")

    cloudinary_cloud_name: str = Field(default="", alias="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: str = Field(default="", alias="CLOUDINARY_API_KEY")
    cloudinary_api_secret: str = Field(default="", alias="CLOUDINARY_API_SECRET")
    cloudinary_folder: str = Field(default="bocra", alias="CLOUDINARY_FOLDER")

    customer_portal_url: str = Field(
        default="https://customerportal.bocra.org.bw/api",
        alias="CUSTOMER_PORTAL_URL",
    )

    dqos_locations_url: str = Field(
        default="https://dqos.bocra.org.bw/api/locations",
        alias="DQOS_LOCATIONS_URL",
    )
    dqos_chartdata_url: str = Field(
        default="https://dqos.bocra.org.bw/api/chartdata",
        alias="DQOS_CHARTDATA_URL",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        # Render and some hosted providers expose Postgres URLs with the legacy
        # postgres:// scheme, while SQLAlchemy expects postgresql://.
        if isinstance(value, str) and value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql://", 1)
        return value

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def is_postgres(self) -> bool:
        return self.database_url.startswith("postgresql")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
