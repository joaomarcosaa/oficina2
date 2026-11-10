from collections import deque

import pytest

from app.game import NIVEIS
from app.main import create_app


@pytest.fixture
def cliente():
    app = create_app({"SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", "TESTING": True})
    c = app.test_client()
    cadastrar(c, "aluno@teste.com")
    return c


def cadastrar(c, email):
    c.post("/auth/register", json={"nome": "Aluno", "email": email, "senha": "123456"})
    c.post("/auth/login", json={"email": email, "senha": "123456"})


def solucao(nivel):
    inicio = (nivel["inicio"]["x"], nivel["inicio"]["y"])
    meta = (nivel["meta"]["x"], nivel["meta"]["y"])
    fila, visitados = deque([(inicio, [])]), {inicio}
    vetores = ((0, -1), (1, 0), (0, 1), (-1, 0))
    while fila:
        (x, y), rota = fila.popleft()
        if (x, y) == meta:
            comandos, atual = [], nivel["inicio"]["direcao"]
            for direcao in rota:
                while atual != direcao:
                    comandos.append("direita")
                    atual = (atual + 1) % 4
                comandos.append("frente")
            return comandos
        for direcao, (dx, dy) in enumerate(vetores):
            nx, ny = x + dx, y + dy
            if (nx, ny) not in visitados and nivel["mapa"][ny][nx] == ".":
                visitados.add((nx, ny))
                fila.append(((nx, ny), rota + [direcao]))
    raise AssertionError("Labirinto sem saída")


def test_exige_login(cliente):
    cliente.post("/auth/logout")
    assert cliente.get("/game/progress").status_code == 401
    assert cliente.get("/game/levels/1").status_code == 401
    assert cliente.post("/game/levels/1/complete", json={"comandos": []}).status_code == 401


def test_bloqueia_fases_futuras(cliente):
    assert cliente.get("/game/levels/1").status_code == 200
    assert cliente.get("/game/levels/2").status_code == 403
    assert cliente.post("/game/levels/2/complete", json={"comandos": solucao(NIVEIS[1])}).status_code == 403
    assert cliente.get("/game/levels/11").status_code == 404


def test_campanha_completa_e_final_sem_fase_11(cliente):
    for nivel in NIVEIS:
        assert cliente.get(f'/game/levels/{nivel["id"]}').status_code == 200
        resp = cliente.post(f'/game/levels/{nivel["id"]}/complete', json={"comandos": solucao(nivel)})
        assert resp.status_code == 200
        assert resp.get_json()["nivel_liberado"] == min(nivel["id"] + 1, 10)
    assert resp.get_json()["concluidos"] == list(range(1, 11))
    assert resp.get_json()["finalizado"] is True


@pytest.mark.parametrize("comandos", [None, [], ["voar"], [42], ["esquerda", "frente"], ["frente"] * 20001])
def test_rejeita_caminho_invalido(cliente, comandos):
    resp = cliente.post("/game/levels/1/complete", json={"comandos": comandos})
    assert resp.status_code == 400
    assert cliente.get("/game/progress").get_json()["concluidos"] == []


def test_rejeita_conclusao_com_comandos_extras(cliente):
    assert cliente.post("/game/levels/1/complete", json={"comandos": solucao(NIVEIS[0]) + ["direita"]}).status_code == 400


def test_progresso_persiste_apos_login_e_nao_mistura_contas(cliente):
    cliente.post("/game/levels/1/complete", json={"comandos": solucao(NIVEIS[0])})
    cliente.post("/auth/logout")
    cadastrar(cliente, "outro@teste.com")
    assert cliente.get("/game/progress").get_json()["concluidos"] == []
    cliente.post("/auth/login", json={"email": "aluno@teste.com", "senha": "123456"})
    assert cliente.get("/game/progress").get_json()["concluidos"] == [1]


def test_repetir_fase_mantem_o_melhor_resultado(cliente):
    comandos = solucao(NIVEIS[0])
    cliente.post("/game/levels/1/complete", json={"comandos": comandos})
    resp = cliente.post("/game/levels/1/complete", json={"comandos": ["frente", "tras"] + comandos})
    assert resp.status_code == 200
    assert resp.get_json()["melhores"]["1"] == NIVEIS[0]["minimo_movimentos"]
