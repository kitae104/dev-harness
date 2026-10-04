from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """환경 변수 설정. 필드 이름의 대문자가 환경 변수 이름입니다 (database_url → DATABASE_URL)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://app:app@localhost:5432/app"
    # 운영 환경에서는 반드시 JWT_SECRET 환경 변수로 32바이트 이상의 임의 문자열을 지정하세요.
    jwt_secret: str = "local-dev-secret-change-me-please-32bytes-or-more"
    jwt_access_token_validity_seconds: int = 3600
    cors_allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    @field_validator("jwt_secret")
    @classmethod
    def secret_must_be_long_enough(cls, value: str) -> str:
        # HS256 키는 32바이트 이상이어야 합니다 (Spring 백엔드와 같은 기준).
        if len(value.encode("utf-8")) < 32:
            raise ValueError("JWT_SECRET 은 최소 32바이트 이상이어야 합니다.")
        return value

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


# 라우터·의존성에서 설정을 받을 때: def handler(settings: SettingsDep)
SettingsDep = Annotated[Settings, Depends(get_settings)]
