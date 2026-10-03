from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.errors import register_error_handlers
from app.routers import health, text

app = FastAPI(
    title="FastAPI service",
    docs_url="/api/py/docs",
    openapi_url="/api/py/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_error_handlers(app)

# 모든 경로는 /api/py 로 시작합니다 (nginx, Vite 프록시 규칙과 일치).
app.include_router(health.router, prefix="/api/py")
app.include_router(text.router, prefix="/api/py")
