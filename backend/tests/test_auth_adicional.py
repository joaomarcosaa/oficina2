import pytest

from sqlalchemy.exc import IntegrityError
from app.main import create_app
from app.auth import db, id_token


@pytest.fixture
def cliente():
    app = create_app({
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "TESTING": True
    })

    return app.test_client()


@pytest.mark.parametrize("dados", [
    {},
    {"email": "aluno@teste.com"},
    {"senha": "123456"}
])
def test_login_sem_credenciais(cliente, dados):
    resposta = cliente.post("/auth/login", json=dados)

    assert resposta.status_code == 400
    assert resposta.get_json()["erro"] == "Informe e-mail e senha."


def test_sessao_com_usuario_inexistente(cliente):
    with cliente.session_transaction() as sessao:
        sessao["usuario_id"] = 999999

    resposta = cliente.get("/auth/me")

    assert resposta.status_code == 401
    assert resposta.get_json()["erro"] == "Não autenticado."

    with cliente.session_transaction() as sessao:
        assert "usuario_id" not in sessao


def test_erro_integridade_cadastro_google(cliente, monkeypatch):
    configuracao = cliente.get("/auth/google/config").get_json()

    def simular_token(*args, **kwargs):
        return {
            "nonce": configuracao["nonce"],
            "email_verified": True,
            "sub": "google-teste-123",
            "email": "google@teste.com",
            "name": "Aluno Teste"
        }

    def simular_erro_commit():
        raise IntegrityError(
            "INSERT",
            {},
            Exception("Erro de integridade")
        )

    monkeypatch.setattr(
        id_token, "verify_oauth2_token", simular_token
    )

    monkeypatch.setattr(
        db.session, "commit", simular_erro_commit
    )

    resposta = cliente.post(
        "/auth/google",
        json={"credential": "token-teste"}
    )

    assert resposta.status_code == 409
    assert resposta.get_json()["erro"] == (
        "Conta já cadastrada. Tente entrar novamente."
    )

    assert cliente.get("/auth/me").status_code == 401