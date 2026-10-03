---
paths:
  - "backend/src/main/java/**/ai/**"
  - "backend/src/test/java/**/ai/**"
  - "backend/build.gradle"
---

# Spring AI 규칙

- 버전: Spring AI 는 BOM(`spring-ai-bom`)으로만 관리하고 개별 모듈에 버전을 쓰지 않습니다. Spring Boot 를 올리면 같은 Boot 버전으로 빌드된 Spring AI 로 함께 올립니다 (Maven Central 의 `spring-ai-parent` 또는 모듈 POM 에서 사용한 `spring-boot` 버전으로 확인).
- 모델 호출은 `ChatClient` (`AiConfig` 의 빈) 로만 합니다. 기능마다 다른 시스템 프롬프트가 필요하면 `ChatClient.Builder` 로 별도 빈을 만들고 `@Qualifier` 로 구분합니다.
- 구조화된 응답이 필요하면 `.call().entity(MyRecord.class)` 를 씁니다. 문자열 파싱으로 JSON 을 꺼내지 않습니다.
- 도구 호출(function calling)은 `@Tool` 메서드를 가진 빈을 만들고 `.tools(bean)` 으로 넘깁니다. 도구는 현재 사용자 권한 안의 데이터만 다룹니다.
- 대화 맥락은 `ChatMemory` + `ChatMemory.CONVERSATION_ID` 로 관리합니다. 사용자 사이에 대화가 섞이지 않도록 ID 는 로그인 사용자 기준으로 정합니다.
- 모델 호출 실패는 `ChatService` 처럼 잡아서 `ApiException(BAD_GATEWAY, ...)` 로 바꿉니다. 원본 예외 메시지(키 일부가 들어 있을 수 있음)를 응답에 노출하지 않습니다.
- 테스트는 `@MockitoBean ChatModel` 로 실제 호출 없이 작성합니다. 네트워크가 필요한 테스트를 기본 `./gradlew test` 에 넣지 않습니다.
- 스트리밍이 필요하면 `.stream().content()` (Flux) 와 `text/event-stream` 응답을 쓰고, 프론트엔드는 `fetch` 의 `ReadableStream` 으로 읽습니다 (`EventSource` 는 Authorization 헤더를 못 보냅니다). 이때 `frontend/nginx.conf` 의 `/api/ai/` 블록에 `proxy_buffering off;` 를 추가해야 조각이 바로 전달됩니다.
