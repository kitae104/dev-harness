---
paths:
  - "fastapi/**"
---

# FastAPI 규칙

- 구조: `app/main.py`(앱, 미들웨어, 라우터 등록) · `app/routers/`(기능별 라우터) · `app/config.py`(환경 변수) · `app/security.py`(JWT 검증) · `app/errors.py`(에러 형식).
- 요청·응답 모델은 pydantic `BaseModel` 로 정의하고 라우터 함수의 반환 타입으로 응답 스키마를 표현합니다. `dict` 를 그대로 반환하지 않습니다 (health 제외).
- 비즈니스 로직이 커지면 `app/services/<기능>.py` 로 분리하고 라우터는 입출력만 다룹니다.
- 설정은 `Settings` 필드로 추가하고 `Depends(get_settings)` 로 주입합니다. `os.environ` 을 직접 읽지 않습니다. 새 환경 변수는 `.env.example` 과 `docker-compose.yml` 의 fastapi `environment` 에도 추가합니다.
- 에러는 `HTTPException(status, "한국어 메시지")` 로 던집니다. 응답 형식은 `app/errors.py` 가 Spring 과 맞춥니다.
- 테스트: `tests/test_<기능>.py`, `client`·`token` 픽스처(conftest.py) 사용. 엔드포인트마다 정상·인증 실패·검증 실패를 확인합니다.
- 포맷과 린트는 ruff (줄 길이 120). 수정 후 `uv run ruff check . && uv run ruff format . && uv run pytest -q`.
