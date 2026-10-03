### FastAPI (`fastapi/`)

- Python 3.13, FastAPI, uv. 의존성 추가는 `cd fastapi && uv add <패키지>` (pyproject.toml 과 uv.lock 을 함께 커밋).
- 새 라우터는 `app/routers/<기능>.py` 에 만들고 `app/main.py` 에서 `prefix="/api/py"` 로 등록합니다. 경로는 항상 `/api/py/**`.
- 인증이 필요한 엔드포인트는 `user: AuthUser` 파라미터를 받습니다. JWT 를 따로 만들거나 사용자 DB 를 두지 않습니다 (사용자 원본은 Spring).
- 검증: `cd fastapi && uv run ruff check . && uv run pytest -q`
- 세부 규칙: `.claude/rules/fastapi.md`
