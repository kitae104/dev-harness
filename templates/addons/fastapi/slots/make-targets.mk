.PHONY: fastapi-logs fastapi-dev

fastapi-logs: ## FastAPI 로그만 보기
	$(COMPOSE) logs -f fastapi

fastapi-dev:  ## FastAPI 로컬 개발 서버 (http://localhost:8000, 코드 변경 시 자동 재시작)
	cd fastapi && uv run uvicorn app.main:app --reload --port 8000
