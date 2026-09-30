from datetime import datetime, timezone

from .extensions import db


class Usuario(db.Model):
    __tablename__ = "usuario"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), nullable=False, unique=True)
    senha_hash = db.Column(db.String(255), nullable=True)  # nulo se login for via Google (RF02)
    google_id = db.Column(db.String(120), nullable=True, unique=True)
    criado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {"id": self.id, "nome": self.nome, "email": self.email}
