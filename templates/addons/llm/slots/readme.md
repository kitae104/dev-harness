## AI 채팅 (`backend/app/ai/`)

FastAPI 백엔드에서 LLM 을 부르는 채팅 API 와 화면(`/chat`)입니다. SDK 없이 각 제공자의 HTTP API 를 `httpx` 로 부르므로 의존성이 늘지 않고, 제공자는 환경 변수 하나(`AI_PROVIDER`)로 바꿉니다.

| 메서드 | 경로 | 인증 | 설명 |
| --- | --- | --- | --- |
| POST | `/api/ai/chat` | Bearer | `{ message }` → `{ reply }`. 사용자별 최근 20개 메시지를 맥락으로 유지 (메모리, 재시작 시 초기화) |
| DELETE | `/api/ai/chat` | Bearer | 내 대화 맥락 초기화 → 204 |

- 설정: `.env` 에 API 키와 모델 이름을 넣으세요 (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`, Ollama 는 `make ai-model` 로 모델을 먼저 받기). 키가 없어도 앱은 뜨고 채팅 요청만 502 로 실패합니다.
- 제공자 바꾸기: `docker-compose.yml` 의 backend `AI_PROVIDER` 를 `openai` / `anthropic` / `ollama` 중 하나로 바꾸고 해당 키·모델 변수를 추가합니다. OpenAI 호환 서버(Groq, Together, vLLM, LM Studio 등)는 `OPENAI_BASE_URL` 만 바꾸면 됩니다.
- 시스템 프롬프트: `AI_SYSTEM_PROMPT` 환경 변수 (`app/ai/config.py`).
- 다른 AI 기능(요약, 분류, RAG 등)은 `app/ai/providers.py` 의 `ChatModelDep` 를 받아 새 라우터에서 쓰면 됩니다.
