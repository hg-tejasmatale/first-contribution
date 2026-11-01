from app.security import create_access_token, hash_password, verify_password

from .conftest import register_and_login


def test_password_hash_roundtrip():
    stored = hash_password("s3cret-pass")
    assert stored != "s3cret-pass"
    assert verify_password("s3cret-pass", stored)
    assert not verify_password("wrong", stored)


def test_register_and_me(client):
    headers = register_and_login(client, email="Bob@Example.com", name="Bob")
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == "bob@example.com"
    assert r.json()["full_name"] == "Bob"


def test_duplicate_email_rejected(client):
    register_and_login(client)
    r = client.post(
        "/api/auth/register",
        json={"email": "a@example.com", "full_name": "Other", "password": "password123"},
    )
    assert r.status_code == 409


def test_register_validation(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "full_name": "X", "password": "short"},
    )
    assert r.status_code == 422


def test_login_wrong_password(client):
    register_and_login(client)
    r = client.post("/api/auth/login", data={"username": "a@example.com", "password": "nope-nope"})
    assert r.status_code == 401


def test_protected_route_requires_token(client):
    assert client.get("/api/tasks").status_code == 401
    r = client.get("/api/tasks", headers={"Authorization": "Bearer garbage"})
    assert r.status_code == 401


def test_expired_token_rejected(client):
    register_and_login(client)
    token = create_access_token(1, expires_minutes=-1)
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
