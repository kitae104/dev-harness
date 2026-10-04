cd backend && uv run pytest -q              # 백엔드 테스트 (SQLite 메모리 DB)
cd backend && uv run ruff check . && uv run ruff format --check .
cd backend && uv run alembic revision --autogenerate -m "설명"   # 모델을 바꾼 뒤 마이그레이션 생성
