"""Typed application settings, loaded from environment / .env."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Secrets must come from the environment, never defaults."""

    model_config = SettingsConfigDict(
        env_prefix="WATTTWIN_",
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    env: Literal["development", "test", "production"] = "development"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    api_host: str = "0.0.0.0"  # noqa: S104 - container bind, documented in .env.example
    api_port: int = 8000

    database_url: str = "postgresql+psycopg://watttwin:watttwin_dev_only@localhost:5433/watttwin"

    # Industrial I/O. Values are placeholders until the Phase 0 gate closes (ADR-0002).
    sim_modbus_host: str = "127.0.0.1"
    sim_modbus_port: int = Field(default=5020, ge=1, le=65535)
    modbus_unit_id: int = Field(default=1, ge=0, le=255)

    openplc_url: str = "https://127.0.0.1:8443"
    openplc_user: str = "openplc"
    openplc_password: str = "openplc"  # noqa: S105 - dev default, overridden by env

    # Agent phase only; the deterministic path must work with these empty.
    llm_provider: str | None = None
    llm_model: str | None = None
    llm_api_key: str | None = None
    mcp_server_url: str | None = None


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings singleton."""
    return Settings()
