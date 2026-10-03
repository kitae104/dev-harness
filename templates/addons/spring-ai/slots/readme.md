## Spring AI (`backend/.../ai/`)

Spring AI 2.0.1 (Spring Boot 4.1.1 기준으로 빌드된 버전)의 `ChatClient` 로 만든 채팅 API 와 화면(`/chat`)입니다. 모델 제공자는 생성할 때 고른 starter 하나로 정해지고, 코드는 제공자와 무관합니다.

| 메서드 | 경로 | 인증 | 설명 |
| --- | --- | --- | --- |
| POST | `/api/ai/chat` | Bearer | `{ message }` → `{ reply }`. 사용자별 최근 20개 메시지를 맥락으로 유지 (메모리, 재시작 시 초기화) |
| DELETE | `/api/ai/chat` | Bearer | 내 대화 맥락 초기화 → 204 |

- 설정: `.env` 에 API 키와 모델 이름을 넣으세요 (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`, Ollama 는 `make ai-model` 로 모델을 먼저 받기). 키가 없어도 앱은 뜨고 채팅 요청만 502 로 실패합니다.
- 시스템 프롬프트: `AI_SYSTEM_PROMPT` 환경 변수 또는 `application.yml` 의 `app.ai.system-prompt`.
- 제공자 교체: `build.gradle` 의 `spring-ai-starter-model-*` 하나와 `application.yml` 의 `spring.ai.*` 설정만 바꾸면 됩니다.
- Spring Boot 버전을 올릴 때는 Spring AI 도 그 Boot 버전으로 빌드된 버전으로 함께 올리세요 (`build.gradle` 의 `springAiVersion`).
