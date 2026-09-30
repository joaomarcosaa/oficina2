import os

from flask import Flask, jsonify, send_from_directory

from .auth import auth_bp
from .extensions import db

FRONTEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
)


def create_app(config=None):
    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///dados.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    # Em produção, defina a variável de ambiente SECRET_KEY com um valor seguro.
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "chave-de-desenvolvimento-trocar-em-producao")
    if config:
        app.config.update(config)

    db.init_app(app)
    app.register_blueprint(auth_bp)

    with app.app_context():
        db.create_all()

    @app.get("/")
    def index():
        # Serve o front-end (frontend/index.html) na mesma origem da API,
        # assim o navegador não bloqueia os cookies de sessão por CORS.
        return send_from_directory(app.static_folder, "index.html")

    @app.get("/health")
    def health():
        return jsonify(status="ok")

    # TODO: registrar blueprint do jogo (RF03-RF09)
    return app


app = create_app()
