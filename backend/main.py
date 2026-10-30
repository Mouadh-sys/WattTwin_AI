"""Compatibility entry point for `uvicorn main:app`.

The application lives in `app.main`. This shim exists because the pre-existing backend
scaffold was launched as `main:app`; it will be removed once all run scripts point at the
package entry point.
"""

from app.main import app

__all__ = ["app"]
