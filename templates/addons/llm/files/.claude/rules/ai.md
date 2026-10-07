---
paths:
  - "backend/app/ai/**"
  - "backend/tests/test_ai.py"
---

# AI 규칙

- 구조: `config.py`(AiSettings, 환경 변수) · `providers.py`(제공자별 HTTP 호출, `ChatModel` 프로토콜, `get_chat_model`) · `service.py`(대화 기억, 실패 처리) · `router.py`(`/api/ai/**`).
- 새 AI 기능(요약, 분류, 추출 등)은 `app/ai/` 또는 새 기능 폴더에 라우터를 만들고 `model: ChatModelDep` 를 받아 `model.complete(system, messages)` 를 부릅니다. 프롬프트 문자열은 서비스 함수 안이나 상수로 두고, 사용자 입력을 system 프롬프트에 그대로 넣지 않습니다.
- 구조화된 결과가 필요하면 `model.complete(..., json_mode=True)` 로 받고 pydantic 모델의 `model_validate_json` 으로 검증합니다. 실패하면 한 번 다시 요청하고, 그래도 실패하면 `ModelError` 로 처리합니다. 작은 로컬 모델(Ollama)은 형식을 자주 틀리므로 이 재시도와 검증을 빼지 않습니다.
- 제공자는 `.env` 의 `AI_PROVIDER`(openai | anthropic | ollama) 하나로 바뀝니다. 코드에서 제공자별 분기를 만들지 말고, 프롬프트는 작은 모델에서도 통하도록 짧고 구체적으로 씁니다 (출력 예시 JSON 포함).
- 시간이 오래 걸리는 호출(긴 피드백 생성 등)은 로컬 모델에서 수십 초 이상 걸릴 수 있습니다. 요청 안에서 기다리게 하지 말고 FastAPI `BackgroundTasks` 로 돌린 뒤 상태 값(PENDING/DONE/FAILED)을 저장해 화면이 다시 조회하게 합니다.
- 모델 오류는 `ModelError` 로 올리고 서비스에서 `ApiError(502, "...")` 로 바꿉니다. 제공자 응답 원문을 사용자에게 보여주지 않습니다 (로그에만).
- 새 제공자: `ChatModel` 을 구현한 클래스를 `providers.py` 에 추가하고 `Provider` Literal 과 `get_chat_model` 에 연결합니다 (`json_mode` 인자도 받기). 새 환경 변수는 `.env.example`, `docker-compose.yml` backend `environment` 에도 추가합니다.
- 오래 걸리는 작업(긴 문서 처리, 임베딩 대량 생성)은 요청 안에서 끝내지 말고 작업 큐나 배치로 분리하는 것을 먼저 제안합니다.
- 테스트: 실제 API 를 부르지 않습니다. 가짜 모델의 `complete` 도 `json_mode` 키워드 인자를 받게 합니다. 라우터는 `get_chat_model` 을 가짜로 바꾸고, 제공자 클래스는 `httpx.post` 를 monkeypatch 해 요청 형식만 확인합니다.
- 딥러닝 모델 학습·실험은 `ml/` 작업 공간(ml 확장 모듈)에서 하고, 백엔드에는 추론에 필요한 최소 코드만 둡니다.
