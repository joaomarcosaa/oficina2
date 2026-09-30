from app.main import create_app


def app_teste():
    return create_app({"SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", "TESTING": True})


def test_health():
    client = app_teste().test_client()
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "ok"}
