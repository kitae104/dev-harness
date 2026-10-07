## AI 채팅 (`backend/app/ai/`)

FastAPI 백엔드에서 LLM 을 부르는 채팅 API 와 화면(`/chat`)입니다. SDK 없이 각 제공자의 HTTP API 를 `httpx` 로 부르므로 의존성이 늘지 않고, 제공자는 환경 변수 하나(`AI_PROVIDER`)로 바꿉니다.

| 메서드 | 경로 | 인증 | 설명 |
| --- | --- | --- | --- |
| POST | `/api/ai/chat` | Bearer | `{ message }` → `{ reply }`. 사용자별 최근 20개 메시지를 맥락으로 유지 (메모리, 재시작 시 초기화) |
| DELETE | `/api/ai/chat` | Bearer | 내 대화 맥락 초기화 → 204 |

- 설정: `.env` 에 API 키와 모델 이름을 넣으세요 (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`). 키가 없어도 앱은 뜨고 AI 요청만 502 로 실패합니다.
- 제공자 바꾸기: `.env` 의 `AI_PROVIDER` 를 `openai` / `anthropic` / `ollama` 중 하나로 바꾸고 `make up` (Windows: `docker compose up -d --build`). OpenAI 호환 서버(Groq, Together, vLLM, LM Studio 등)는 `OPENAI_BASE_URL` 과 모델 이름만 바꾸면 됩니다.
- 구조화된 결과: `model.complete(system, messages, json_mode=True)` 는 JSON 객체 하나만 받도록 요청합니다 (OpenAI·Ollama 는 API 의 JSON 모드). 받는 쪽에서 pydantic 으로 검증하세요.

### Ollama (무료 로컬 LLM)

`.env` 에서 두 줄을 고르고 `make up` → `make ai-model` 이면 됩니다. Ollama 는 이 프로젝트 Compose 안에서 함께 켜지고 꺼집니다.

| 내 PC | `.env` | 비고 |
| --- | --- | --- |
| Windows·macOS·Linux, CPU 만 | `AI_PROVIDER=ollama`, `COMPOSE_PROFILES=ollama` | 가장 쉬움. 4B 모델 기준 메모리 8GB 이상 권장 |
| Windows + NVIDIA GPU | `AI_PROVIDER=ollama`, `COMPOSE_PROFILES=ollama-gpu` | Docker Desktop(WSL2) + 최신 NVIDIA 드라이버. `docker run --rm --gpus all ubuntu nvidia-smi` 로 먼저 확인 |
| Linux + NVIDIA GPU | 위와 같음 | NVIDIA Container Toolkit 필요 |
| macOS (Apple Silicon) 에서 GPU 로 빠르게 | `AI_PROVIDER=ollama`, `COMPOSE_PROFILES=` (비움), `OLLAMA_DOCKER_URL=http://host.docker.internal:11434` | Docker 는 Apple GPU 를 못 쓰므로 https://ollama.com 앱을 PC 에 설치하고 `ollama pull gemma3:4b` |
| 다른 서버(원격 GPU 등)의 Ollama 쓰기 | `AI_PROVIDER=ollama`, `COMPOSE_PROFILES=` (비움), `OLLAMA_DOCKER_URL` 과 `OLLAMA_BASE_URL` 둘 다 `http://<서버주소>:11434` | 서버의 Ollama 가 네트워크에 열려 있어야 함(`OLLAMA_HOST=0.0.0.0`). 안 열려 있으면 `ssh -N -L 11434:localhost:11434 사용자@서버` 터널을 켜 두고 `host.docker.internal` 주소를 씀. 모델은 서버에서 `ollama pull` |

```bash
make up          # COMPOSE_PROFILES 에 따라 Ollama 컨테이너도 함께 실행
make ai-model    # .env 의 OLLAMA_MODEL 내려받기 (처음 한 번, 수 GB)
make ai-models   # 받은 모델 목록
# Windows (make 없음): docker compose up -d --build
#                      docker compose exec ollama ollama pull gemma3:4b   (GPU 는 ollama-gpu)
```

모델 고르기 (`OLLAMA_MODEL`, 바꾼 뒤 `make ai-model` 과 `make up`): `gemma3:4b`(기본, 약 3.3GB, CPU 가능) · `gemma3:12b`(약 8GB, GPU 권장, 한국어 품질 좋음) · `qwen3:8b`(약 5GB, 생각 과정 `<think>` 는 자동으로 지움) · `exaone3.5:7.8b`(LG, 한국어 강함, 라이선스의 상업적 사용 제한 확인). 긴 입력이 잘리면 `OLLAMA_CONTEXT_LENGTH` 를 늘립니다. 처음 요청은 모델을 메모리에 올리느라 느리고, `OLLAMA_KEEP_ALIVE` 동안은 빠릅니다.
- 시스템 프롬프트: `AI_SYSTEM_PROMPT` 환경 변수 (`app/ai/config.py`).
- 다른 AI 기능(요약, 분류, RAG 등)은 `app/ai/providers.py` 의 `ChatModelDep` 를 받아 새 라우터에서 쓰면 됩니다.
