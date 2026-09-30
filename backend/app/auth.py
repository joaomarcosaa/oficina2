import os
import re

from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db
from .models import Usuario

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.post("/register")
def register():
    """RF01 - O sistema deve permitir que o usuário crie uma conta."""
    dados = request.get_json(silent=True) or {}
    nome = (dados.get("nome") or "").strip()
    email = (dados.get("email") or "").strip().lower()
    senha = dados.get("senha") or ""

    erros = {}
    if not nome:
        erros["nome"] = "Informe o nome."
    if not email or not EMAIL_REGEX.match(email):
        erros["email"] = "Informe um e-mail válido."
    if not senha or len(senha) < 6:
        erros["senha"] = "A senha deve ter pelo menos 6 caracteres."

    if erros:
        return jsonify(erro="Dados inválidos.", detalhes=erros), 400

    if Usuario.query.filter_by(email=email).first():
        return jsonify(erro="Já existe uma conta com esse e-mail."), 409

    usuario = Usuario(
        nome=nome,
        email=email,
        senha_hash=generate_password_hash(senha),
    )
    db.session.add(usuario)
    db.session.commit()

    return jsonify(usuario.to_dict()), 201


@auth_bp.post("/login")
def login():
    """Permite que um usuário cadastrado (RF01) entre no sistema."""
    dados = request.get_json(silent=True) or {}
    email = (dados.get("email") or "").strip().lower()
    senha = dados.get("senha") or ""

    if not email or not senha:
        return jsonify(erro="Informe e-mail e senha."), 400

    usuario = Usuario.query.filter_by(email=email).first()

    # Mesma mensagem para e-mail inexistente e senha errada, para não revelar
    # se o e-mail está ou não cadastrado.
    credenciais_invalidas = (
        usuario is None
        or usuario.senha_hash is None  # conta criada só via Google (RF02)
        or not check_password_hash(usuario.senha_hash, senha)
    )
    if credenciais_invalidas:
        return jsonify(erro="E-mail ou senha incorretos."), 401

    session["usuario_id"] = usuario.id
    return jsonify(usuario.to_dict()), 200


@auth_bp.post("/logout")
def logout():
    session.pop("usuario_id", None)
    return jsonify(mensagem="Sessão encerrada."), 200


@auth_bp.get("/me")
def me():
    """Retorna o usuário logado (usa o cookie de sessão criado no /login)."""
    usuario_id = session.get("usuario_id")
    if not usuario_id:
        return jsonify(erro="Não autenticado."), 401

    usuario = db.session.get(Usuario, usuario_id)
    if not usuario:
        session.pop("usuario_id", None)
        return jsonify(erro="Não autenticado."), 401

    return jsonify(usuario.to_dict()), 200
