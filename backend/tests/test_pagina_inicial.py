from app.main import create_app


def test_pagina_inicial():
    app = create_app({
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "TESTING": True
    })

    cliente = app.test_client()

    resposta = cliente.get("/")

    assert resposta.status_code == 200
    assert resposta.mimetype == "text/html"
    assert b"<html" in resposta.data.lower()