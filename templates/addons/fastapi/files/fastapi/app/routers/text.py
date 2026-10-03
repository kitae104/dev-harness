from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.security import AuthUser

router = APIRouter(prefix="/text", tags=["text"])


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10_000)


class AnalyzeResponse(BaseModel):
    characters: int
    words: int
    lines: int


@router.post("/analyze")
def analyze(body: AnalyzeRequest, _: AuthUser) -> AnalyzeResponse:
    """Python 쪽 처리 예시. 실제 데이터 처리·ML 코드는 이런 식으로 라우터를 추가하세요."""
    return AnalyzeResponse(
        characters=len(body.text),
        words=len(body.text.split()),
        lines=len(body.text.splitlines()),
    )
