import secrets
import re

from flask import Blueprint, current_app, jsonify, request, session
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token
from sqlalchemy.exc import IntegrityError
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


@auth_bp.get("/google/config")
def google_config():
    """Configuração pública e nonce para vincular o token à sessão."""
    nonce = secrets.token_urlsafe(32)
    session["google_nonce"] = nonce
    resposta = jsonify(client_id=current_app.config["GOOGLE_CLIENT_ID"], nonce=nonce)
    resposta.headers["Cache-Control"] = "no-store"
    return resposta


@auth_bp.post("/google")
def google_login():
    """RF02: valida o token Google antes de criar a sessão local."""
    dados = request.get_json(silent=True)
    token = dados.get("credential") if isinstance(dados, dict) else None
    if not isinstance(token, str) or not token:
        return jsonify(erro="Informe a credencial do Google."), 400
    nonce = session.get("google_nonce")
    if not nonce:
        return jsonify(erro="Recarregue a página para entrar com o Google."), 401
    try:
        info = id_token.verify_oauth2_token(
            token, GoogleRequest(), current_app.config["GOOGLE_CLIENT_ID"]
        )
    except ValueError:
        return jsonify(erro="Credencial do Google inválida ou expirada."), 401
    except GoogleAuthError:
        return jsonify(erro="Não foi possível verificar o Google. Tente novamente."), 503
    if (not isinstance(info.get("nonce"), str)
            or not secrets.compare_digest(info["nonce"], nonce)
            or info.get("email_verified") is not True
            or not info.get("sub") or not info.get("email")):
        return jsonify(erro="Credencial do Google inválida."), 401

    usuario = Usuario.query.filter_by(google_id=info["sub"]).first()
    if usuario is None:
        email = info["email"].strip().lower()
        # Vincular contas existentes exige comprovar acesso à conta local.
        if Usuario.query.filter_by(email=email).first():
            return jsonify(erro="Esse e-mail já possui uma conta. Entre com sua senha."), 409
        usuario = Usuario(nome=(info.get("name") or email)[:120],
                          email=email, google_id=info["sub"], senha_hash=None)
        db.session.add(usuario)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify(erro="Conta já cadastrada. Tente entrar novamente."), 409
    session.clear()
    session["usuario_id"] = usuario.id
    return jsonify(usuario.to_dict()), 200
