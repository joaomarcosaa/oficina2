from app.main import create_app


def cliente():
    app = create_app({"SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", "TESTING": True})
    return app.test_client()


def cadastrar(c, email="joao@teste.com", senha="123456"):
    return c.post("/auth/register", json={"nome": "João", "email": email, "senha": senha})


def test_cadastro_com_sucesso():
    resp = cadastrar(cliente())
    assert resp.status_code == 201
    corpo = resp.get_json()
    assert corpo["nome"] == "João"
    assert corpo["email"] == "joao@teste.com"
    assert "senha" not in corpo and "senha_hash" not in corpo


def test_nao_permite_email_duplicado():
    c = cliente()
    cadastrar(c)
    resp = cadastrar(c)
    assert resp.status_code == 409


def test_valida_campos_obrigatorios():
    resp = cliente().post("/auth/register", json={"nome": "", "email": "invalido", "senha": "123"})
    assert resp.status_code == 400
    detalhes = resp.get_json()["detalhes"]
    assert "nome" in detalhes and "email" in detalhes and "senha" in detalhes


def test_login_com_sucesso():
    c = cliente()
    cadastrar(c)
    resp = c.post("/auth/login", json={"email": "joao@teste.com", "senha": "123456"})
    assert resp.status_code == 200
    assert resp.get_json()["email"] == "joao@teste.com"


def test_login_com_senha_errada():
    c = cliente()
    cadastrar(c)
    resp = c.post("/auth/login", json={"email": "joao@teste.com", "senha": "senha-errada"})
    assert resp.status_code == 401


def test_login_com_email_inexistente():
    resp = cliente().post("/auth/login", json={"email": "ninguem@teste.com", "senha": "123456"})
    assert resp.status_code == 401


def test_me_sem_login():
    resp = cliente().get("/auth/me")
    assert resp.status_code == 401


def test_me_apos_login():
    c = cliente()
    cadastrar(c)
    c.post("/auth/login", json={"email": "joao@teste.com", "senha": "123456"})
    resp = c.get("/auth/me")
    assert resp.status_code == 200
    assert resp.get_json()["email"] == "joao@teste.com"


def test_logout():
    c = cliente()
    cadastrar(c)
    c.post("/auth/login", json={"email": "joao@teste.com", "senha": "123456"})
    c.post("/auth/logout")
    resp = c.get("/auth/me")
    assert resp.status_code == 401
