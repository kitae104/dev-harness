### Spring AI (`backend/src/main/java/<패키지>/ai/`)

- Spring AI 2.0.1 은 Spring Boot 4.1.1 과 짝입니다. **Boot 버전을 바꾸면 Spring AI 도 그 Boot 버전으로 빌드된 버전으로 함께 바꿉니다** (`build.gradle` 의 `springAiVersion`, BOM 사용).
- 모델 호출은 `ChatClient` 빈만 사용합니다. 특정 제공자의 `*ChatModel` 클래스나 SDK 를 직접 쓰지 않습니다.
- 테스트는 실제 모델을 부르지 않습니다. `@MockitoBean ChatModel` 로 바꿔 검증합니다 (`ChatControllerTest` 참고).
- API 키는 환경 변수로만 받습니다. 코드·yml·테스트에 실제 키를 쓰지 않습니다.
- 세부 규칙: `.claude/rules/spring-ai.md`
