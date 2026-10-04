.PHONY: backend-dev migrate

backend-dev: ## FastAPI 백엔드 로컬 실행 (http://localhost:8080, DB 는 make db)
	cd backend && uv sync && uv run alembic upgrade head && uv run uvicorn app.main:app --reload --port 8080

migrate:     ## 로컬 DB 에 마이그레이션 적용
	cd backend && uv run alembic upgrade head
