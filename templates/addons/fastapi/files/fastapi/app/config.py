from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """환경 변수 설정. Spring 백엔드와 같은 이름(JWT_SECRET 등)을 씁니다."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    jwt_secret: str = "local-dev-secret-change-me-please-32bytes-or-more"
    cors_allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
