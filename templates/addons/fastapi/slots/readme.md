## FastAPI 서비스 (`fastapi/`)

Python 으로 처리할 기능(데이터 처리, ML 등)을 담는 서비스입니다. 모든 경로가 `/api/py` 로 시작하고, 프론트엔드의 프록시(nginx·Vite 또는 Next.js rewrites)가 이 경로를 FastAPI 로 보냅니다.

- 인증: Spring 이 발급한 JWT 를 같은 `JWT_SECRET` 으로 검증합니다 (`app/security.py`). 프론트엔드는 같은 토큰을 그대로 씁니다.
- 에러 응답: Spring 과 같은 `{ status, message, errors, timestamp }` 형식입니다.
- API 문서: http://localhost:8000/api/py/docs

| 메서드 | 경로 | 인증 | 설명 |
| --- | --- | --- | --- |
| GET | `/api/py/health` | - | 헬스 체크 |
| GET | `/api/py/me` | Bearer | 토큰 검증 결과 `{ email, role }` |
| POST | `/api/py/text/analyze` | Bearer | 예시 처리 `{ text }` → `{ characters, words, lines }` |

```bash
cd fastapi
uv sync                      # 의존성 설치 (uv: https://docs.astral.sh/uv/)
make fastapi-dev             # 프로젝트 루트에서: 로컬 개발 서버 http://localhost:8000
uv run pytest                # 테스트
uv run ruff check . && uv run ruff format --check .
```
