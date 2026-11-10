"""Fases versionadas e progresso validado pelo servidor (RF08/RF09)."""
import json
from functools import wraps
from pathlib import Path

from flask import Blueprint, jsonify, request, session

from .extensions import db
from .models import Progresso, Usuario

game_bp = Blueprint("game", __name__, url_prefix="/game")
NIVEIS = json.loads(Path(__file__).with_name("levels.json").read_text(encoding="utf-8"))
VETORES = ((0, -1), (1, 0), (0, 1), (-1, 0))


def autenticado(funcao):
    @wraps(funcao)
    def executar(*args, **kwargs):
        usuario_id = session.get("usuario_id")
        if not usuario_id or db.session.get(Usuario, usuario_id) is None:
            return jsonify(erro="Entre na sua conta para jogar."), 401
        return funcao(*args, **kwargs)
    return executar


def progresso_atual():
    registros = Progresso.query.filter_by(usuario_id=session["usuario_id"]).all()
    concluidos = sorted(r.nivel_id for r in registros)
    liberado = 1
    while liberado in concluidos and liberado < len(NIVEIS):
        liberado += 1
    return {"concluidos": concluidos, "nivel_liberado": liberado,
            "finalizado": len(concluidos) == len(NIVEIS),
            "melhores": {str(r.nivel_id): r.melhor_movimentos for r in registros}}


@game_bp.get("/progress")
@autenticado
def progress():
    return jsonify(progresso_atual())


@game_bp.get("/levels/<int:nivel_id>")
@autenticado
def level(nivel_id):
    if not 1 <= nivel_id <= len(NIVEIS):
        return jsonify(erro="Fase não encontrada."), 404
    if nivel_id > progresso_atual()["nivel_liberado"]:
        return jsonify(erro="Conclua a fase anterior para liberar esta fase."), 403
    return jsonify(NIVEIS[nivel_id - 1])


def validar_conclusao(nivel, comandos):
    if not isinstance(comandos, list) or not 1 <= len(comandos) <= 20000:
        return None
    x, y = nivel["inicio"]["x"], nivel["inicio"]["y"]
    direcao, movimentos = nivel["inicio"]["direcao"], 0
    for indice, comando in enumerate(comandos):
        if not isinstance(comando, str) or comando not in ("frente", "tras", "esquerda", "direita"):
            return None
        if comando in ("esquerda", "direita"):
            direcao = (direcao + (1 if comando == "direita" else 3)) % 4
        else:
            dx, dy = VETORES[direcao]
            sinal = 1 if comando == "frente" else -1
            nx, ny = x + sinal * dx, y + sinal * dy
            if not (0 <= nx < nivel["tamanho"] and 0 <= ny < nivel["tamanho"]):
                return None
            if nivel["mapa"][ny][nx] != ".":
                return None
            x, y = nx, ny
            movimentos += 1
        if x == nivel["meta"]["x"] and y == nivel["meta"]["y"]:
            return movimentos if indice == len(comandos) - 1 else None
    return None


@game_bp.post("/levels/<int:nivel_id>/complete")
@autenticado
def complete(nivel_id):
    if not 1 <= nivel_id <= len(NIVEIS):
        return jsonify(erro="Fase não encontrada."), 404
    if nivel_id > progresso_atual()["nivel_liberado"]:
        return jsonify(erro="Esta fase ainda está bloqueada."), 403
    dados = request.get_json(silent=True)
    movimentos = validar_conclusao(NIVEIS[nivel_id - 1], dados.get("comandos") if isinstance(dados, dict) else None)
    if movimentos is None:
        return jsonify(erro="Não foi possível validar o caminho até a saída."), 400
    registro = Progresso.query.filter_by(usuario_id=session["usuario_id"], nivel_id=nivel_id).first()
    if registro is None:
        registro = Progresso(usuario_id=session["usuario_id"], nivel_id=nivel_id, melhor_movimentos=movimentos)
        db.session.add(registro)
    else:
        registro.melhor_movimentos = min(registro.melhor_movimentos, movimentos)
    db.session.commit()
    return jsonify(progresso_atual())
