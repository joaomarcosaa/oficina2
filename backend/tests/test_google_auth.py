import pytest
from google.auth.exceptions import TransportError
from app.main import create_app
from app.extensions import db
from app.models import Usuario


@pytest.fixture
def cliente():
    app = create_app({"SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
                      "TESTING": True, "GOOGLE_CLIENT_ID": "cliente-teste"})
    return app.test_client()


def preparar(cliente, monkeypatch, **alteracoes):
    config = cliente.get("/auth/google/config").get_json()
    info = {"sub": "google-123", "email": "aluno@gmail.com",
            "email_verified": True, "name": "Aluno", "nonce": config["nonce"]}
    info.update(alteracoes)
    def verificar(token, request, audience):
        assert token == "token-teste"
        assert audience == "cliente-teste"
        return info
    monkeypatch.setattr("app.auth.id_token.verify_oauth2_token", verificar)
    return info


def entrar(cliente):
    return cliente.post("/auth/google", json={"credential": "token-teste"})


def test_cria_conta_e_sessao(cliente, monkeypatch):
    preparar(cliente, monkeypatch)
    resp = entrar(cliente)
    assert resp.status_code == 200
    assert resp.get_json()["nome"] == "Aluno"
    assert cliente.get("/auth/me").status_code == 200
    with cliente.application.app_context():
        usuario = Usuario.query.one()
        assert usuario.google_id == "google-123"
        assert usuario.senha_hash is None
    assert cliente.post("/auth/logout").status_code == 200
    assert cliente.get("/auth/me").status_code == 401


def test_reutiliza_conta_google(cliente, monkeypatch):
    preparar(cliente, monkeypatch)
    primeiro = entrar(cliente).get_json()["id"]
    preparar(cliente, monkeypatch)
    assert entrar(cliente).get_json()["id"] == primeiro
    with cliente.application.app_context():
        assert Usuario.query.count() == 1


@pytest.mark.parametrize("dados", [{}, {"credential": 42}, []])
def test_credencial_ausente_ou_invalida(cliente, dados):
    assert cliente.post("/auth/google", json=dados).status_code == 400


def test_sem_nonce_na_sessao(cliente):
    assert entrar(cliente).status_code == 401


@pytest.mark.parametrize("claims", [
    {"nonce": "outra-sessao"}, {"email_verified": False},
    {"sub": ""}, {"email": ""},
])
def test_rejeita_claims_invalidos(cliente, monkeypatch, claims):
    preparar(cliente, monkeypatch, **claims)
    assert entrar(cliente).status_code == 401
    assert cliente.get("/auth/me").status_code == 401


def test_token_expirado_ou_audiencia_invalida(cliente, monkeypatch):
    preparar(cliente, monkeypatch)
    def invalido(*args):
        raise ValueError("Token inválido")
    monkeypatch.setattr("app.auth.id_token.verify_oauth2_token", invalido)
    assert entrar(cliente).status_code == 401


def test_indisponibilidade_google(cliente, monkeypatch):
    preparar(cliente, monkeypatch)
    def indisponivel(*args):
        raise TransportError("Sem conexão")
    monkeypatch.setattr("app.auth.id_token.verify_oauth2_token", indisponivel)
    assert entrar(cliente).status_code == 503


def test_nao_vincula_conta_local_sem_comprovar_acesso(cliente, monkeypatch):
    cliente.post("/auth/register", json={"nome": "Local", "email": "aluno@gmail.com",
                                        "senha": "123456"})
    preparar(cliente, monkeypatch)
    assert entrar(cliente).status_code == 409
    assert cliente.get("/auth/me").status_code == 401
    with cliente.application.app_context():
        assert Usuario.query.one().google_id is None


def test_nonce_nao_pode_ser_reutilizado(cliente, monkeypatch):
    preparar(cliente, monkeypatch)
    assert entrar(cliente).status_code == 200
    assert entrar(cliente).status_code == 401
