import pytest

from app.game import validar_conclusao
from app.main import create_app


@pytest.fixture
def nivel_teste():
    return {
        "tamanho": 3,
        "mapa": [
            "...",
            "...",
            "..."
        ],
        "inicio": {"x": 1, "y": 1, "direcao": 1},
        "meta": {"x": 2, "y": 1}
    }


def test_movimento_para_frente(nivel_teste):
    assert validar_conclusao(nivel_teste, ["frente"]) == 1


def test_movimento_para_tras(nivel_teste):
    nivel_teste["meta"] = {"x": 0, "y": 1}
    assert validar_conclusao(nivel_teste, ["tras"]) == 1


def test_rotacao_esquerda(nivel_teste):
    nivel_teste["meta"] = {"x": 1, "y": 0}
    assert validar_conclusao(
        nivel_teste, ["esquerda", "frente"]
    ) == 1


def test_rotacao_direita(nivel_teste):
    nivel_teste["meta"] = {"x": 1, "y": 2}
    assert validar_conclusao(
        nivel_teste, ["direita", "frente"]
    ) == 1


def test_colisao_com_parede(nivel_teste):
    nivel_teste["mapa"][1] = "..#"
    assert validar_conclusao(nivel_teste, ["frente"]) is None


def test_movimento_fora_do_mapa(nivel_teste):
    nivel_teste["inicio"]["x"] = 0
    assert validar_conclusao(nivel_teste, ["tras"]) is None


def test_caminho_sem_alcancar_meta(nivel_teste):
    assert validar_conclusao(nivel_teste, ["tras"]) is None


def test_limite_maximo_de_comandos(nivel_teste):
    comandos = ["direita"] * 19999 + ["tras"]

    nivel_teste["meta"] = {"x": 1, "y": 2}

    assert validar_conclusao(nivel_teste, comandos) == 1


def test_excede_limite_de_comandos(nivel_teste):
    comandos = ["direita"] * 20000 + ["frente"]
    assert validar_conclusao(nivel_teste, comandos) is None

@pytest.mark.parametrize("nivel_id", [0, 11, 999])
def test_concluir_fase_inexistente(nivel_id):
    app = create_app({
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "TESTING": True
    })

    cliente = app.test_client()

    cliente.post("/auth/register", json={
        "nome": "Aluno",
        "email": "aluno@teste.com",
        "senha": "123456"
    })

    cliente.post("/auth/login", json={
        "email": "aluno@teste.com",
        "senha": "123456"
    })

    resposta = cliente.post(
        f"/game/levels/{nivel_id}/complete",
        json={"comandos": ["frente"]}
    )

    assert resposta.status_code == 404
    assert resposta.get_json()["erro"] == "Fase não encontrada."

    progresso = cliente.get("/game/progress").get_json()
    assert progresso["concluidos"] == []