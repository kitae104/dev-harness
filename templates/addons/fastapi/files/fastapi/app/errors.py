from datetime import UTC, datetime

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def error_body(status: int, message: str, errors: dict[str, str] | None = None) -> dict:
    """Spring 백엔드의 ErrorResponse 와 같은 형식 { status, message, errors, timestamp }."""
    return {
        "status": status,
        "message": message,
        "errors": errors or {},
        "timestamp": datetime.now(UTC).isoformat(),
    }


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(error_body(exc.status_code, str(exc.detail)), status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        errors: dict[str, str] = {}
        for err in exc.errors():
            field = str(err["loc"][-1]) if err.get("loc") else "body"
            errors.setdefault(field, err["msg"])
        return JSONResponse(error_body(400, "입력값을 확인해 주세요.", errors), status_code=400)
