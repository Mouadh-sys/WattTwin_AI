"""WattTwin AI API application factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.routes import health
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="WattTwin AI API",
        version=__version__,
        description=(
            "Simulation-first industrial digital twin. All energy results are simulated "
            "or modelled; no real-plant savings are claimed."
        ),
    )

    if settings.env == "development":
        # Local Vite dev server only. Production origins will be explicit.
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(health.router, prefix="/api/v1")
    return app


app = create_app()
