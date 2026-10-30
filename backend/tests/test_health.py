from fastapi.testclient import TestClient

from app.main import app


def test_health_reports_service_identity() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "watttwin-backend"
    assert body["environment"] in {"development", "test", "production"}
    assert body["version"] == "0.1.0"


def test_openapi_is_served() -> None:
    client = TestClient(app)
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.json()["info"]["title"] == "WattTwin AI API"


def test_unknown_route_returns_404() -> None:
    client = TestClient(app)
    assert client.get("/api/v1/does-not-exist").status_code == 404
