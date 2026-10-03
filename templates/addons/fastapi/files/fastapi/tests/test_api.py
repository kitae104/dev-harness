import time

import jwt

from tests.conftest import TEST_SECRET


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    res = client.get("/api/py/health")
    assert res.status_code == 200
    assert res.json() == {"status": "UP"}


def test_me_requires_token(client):
    res = client.get("/api/py/me")
    assert res.status_code == 401
    assert res.json()["message"] == "인증이 필요합니다."


def test_me_rejects_bad_token(client):
    res = client.get("/api/py/me", headers=auth("not-a-jwt"))
    assert res.status_code == 401


def test_me_rejects_token_without_exp(client):
    no_exp = jwt.encode({"sub": "user@example.com", "role": "USER"}, TEST_SECRET, algorithm="HS256")
    assert client.get("/api/py/me", headers=auth(no_exp)).status_code == 401


def test_me_rejects_expired_token(client):
    expired = jwt.encode({"sub": "user@example.com", "exp": int(time.time()) - 10}, TEST_SECRET, algorithm="HS256")
    assert client.get("/api/py/me", headers=auth(expired)).status_code == 401


def test_me_with_spring_style_token(client, token):
    res = client.get("/api/py/me", headers=auth(token))
    assert res.status_code == 200
    assert res.json() == {"email": "user@example.com", "role": "USER"}


def test_analyze(client, token):
    res = client.post("/api/py/text/analyze", json={"text": "hello world\nbye"}, headers=auth(token))
    assert res.status_code == 200
    assert res.json() == {"characters": 15, "words": 3, "lines": 2}


def test_analyze_validation_error_shape(client, token):
    res = client.post("/api/py/text/analyze", json={"text": ""}, headers=auth(token))
    assert res.status_code == 400
    body = res.json()
    assert body["message"] == "입력값을 확인해 주세요."
    assert "text" in body["errors"]
