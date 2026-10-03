from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.config import Settings, get_settings

# Spring(jjwt)은 비밀값 길이에 따라 HS256/384/512 중 하나로 서명합니다.
ALGORITHMS = ["HS256", "HS384", "HS512"]

bearer = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    email: str
    role: str


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> CurrentUser:
    """Authorization: Bearer <Spring 이 발급한 토큰> 을 검증합니다."""
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "인증이 필요합니다.")
    try:
        # 만료(exp)와 사용자(sub)가 없는 토큰은 받지 않습니다.
        claims = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=ALGORITHMS,
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "인증이 필요합니다.") from e
    return CurrentUser(email=claims["sub"], role=claims.get("role", "USER"))


AuthUser = Annotated[CurrentUser, Depends(get_current_user)]
