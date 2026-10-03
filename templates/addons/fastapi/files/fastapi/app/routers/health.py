from fastapi import APIRouter

from app.security import AuthUser, CurrentUser

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP"}


@router.get("/me")
def me(user: AuthUser) -> CurrentUser:
    """Spring 에서 로그인한 토큰이 이 서비스에서도 통하는지 확인하는 용도."""
    return user
