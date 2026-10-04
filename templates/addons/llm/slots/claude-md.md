### AI 채팅 (`backend/app/ai/`)

- 모델 호출은 `app/ai/providers.py` 의 `ChatModel`(`ChatModelDep` 의존성)로만 합니다. 라우터·서비스에서 제공자 HTTP API 나 SDK 를 직접 부르지 않습니다.
- 테스트는 실제 모델을 부르지 않습니다. `app.dependency_overrides[get_chat_model]` 로 가짜 모델을 넣습니다 (`tests/test_ai.py` 참고).
- API 키는 환경 변수로만 받습니다. 코드·테스트에 실제 키를 쓰지 않습니다.
- 세부 규칙: `.claude/rules/ai.md`
