# 2) 백엔드 (http://localhost:8080, 코드 변경 시 자동 재시작)
make backend-dev     # = cd backend && uv sync && uv run alembic upgrade head && uv run uvicorn app.main:app --reload --port 8080
