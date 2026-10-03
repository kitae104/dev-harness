import time

import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import app

TEST_SECRET = "test-secret-for-unit-tests-only-32bytes-long"


@pytest.fixture
def client():
    app.dependency_overrides[get_settings] = lambda: Settings(jwt_secret=TEST_SECRET)
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def token():
    """Spring(jjwt)이 만드는 토큰과 같은 모양 (32~47바이트 비밀값이면 HS256): sub=이메일, role 클레임."""
    now = int(time.time())
    claims = {"sub": "user@example.com", "role": "USER", "iat": now, "exp": now + 600}
    return jwt.encode(claims, TEST_SECRET, algorithm="HS256")
