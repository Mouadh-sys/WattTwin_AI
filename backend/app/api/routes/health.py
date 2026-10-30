"""Health and readiness endpoints.

Phase 0 scope: liveness only. Readiness will additionally check PostgreSQL and the
industrial runner once those exist; it must not claim readiness it cannot verify.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app import __version__
from app.core.config import get_settings

router = APIRouter(tags=["system"])


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service="watttwin-backend",
        version=__version__,
        environment=settings.env,
    )
