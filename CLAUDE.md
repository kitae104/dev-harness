# dev-harness 작업 안내

이 저장소는 프로젝트 템플릿과 생성기입니다. 여기서 만드는 것은 "앱"이 아니라 "앱을 만드는 틀"입니다.

## 구조
- `templates/s-r/`: 기본 템플릿. **그 자체로 실행 가능한 프로젝트**여야 합니다 (자리표시자 이름 `com.example.app`, `app`). 하네스 파일(`CLAUDE.md`, `.claude/`)도 여기 있고, 그대로 생성된 프로젝트에 들어갑니다.
- `templates/stacks/<부분>-<id>/`: 백엔드(`backend-fastapi`)·프론트엔드(`frontend-next`)를 통째로 바꾸는 스택. `stack.json`(blocks, slots) + `files/` + `blocks/`. 고르면 기본 템플릿의 `backend/` 또는 `frontend/` 가 빠집니다.
- `templates/addons/<id>/`: `addon.json`(slots, options, requires, includes) + `files/`(덮어쓸 파일) + `files-<값>/`(그 값을 골랐을 때만, 예: `files-next/`) + `slots/`(삽입 조각).
- `scripts/new-project.mjs`: 생성기. Node 표준 라이브러리만 사용.
- `.claude/skills/s-r-*`: 사용자가 쓰는 생성 명령. `generate.mjs` 는 생성기를 확장 모듈 고정값으로 부르는 얇은 실행기.

## 규칙
- 기본 템플릿에 확장 지점이 필요하면 해당 파일의 주석 문법으로 `@addon:<slot>` 줄을 추가하고, 확장 모듈의 `addon.json` 에 연결합니다. 표시 줄은 선택 안 하면 지워지므로 그 줄만으로 문법이 깨지지 않게 둡니다.
- 쓰이지 않는 slot 은 생성기가 오류로 처리합니다 (오타 방지). 프론트엔드·백엔드마다 다른 조각은 `slots/<이름>.{frontend}.tsx` 처럼 값별 파일로 둡니다.
- 스택이 바꿔야 하는 공용 파일 부분은 `@block:<부분>-<이름>` ~ `@endblock` 으로 감싸고 스택의 `stack.json` blocks 에 연결합니다. 모든 스택이 같은 block 을 채워야 공용 파일이 맞게 나옵니다.
- 두 프론트엔드의 공용 경로(`src/api/client.ts`, `src/auth/AuthContext.tsx`, `src/components/ui/`, `src/styles/theme.css`, `src/config/site.ts`, `scripts/check-design.mjs`)와 두 백엔드의 API 계약(경로, camelCase, 에러 형식, JWT)은 같게 유지합니다. 한쪽을 바꾸면 다른 쪽도 바꿉니다.
- 화면 코드는 디자인 토큰 클래스만 씁니다 (직접 색 지정은 생성된 프로젝트의 `npm run lint` 가 막음). 확장 모듈의 화면도 같습니다.
- 이름 바꾸기 규칙을 추가하면 `renameContent` 에 파일 경로별로 좁게 넣습니다. `app` 같은 단어를 전역 치환하지 않습니다.
- 새 서비스·볼륨은 `${COMPOSE_PROJECT_NAME:-app}-...` 이름, `127.0.0.1` 포트 바인딩 규칙을 지킵니다.
- 생성된 프로젝트에 들어갈 규칙 문서(`templates/s-r/.claude/rules`, 확장 모듈의 `files/.claude/rules`)는 실제 코드와 맞아야 합니다. 코드 패턴을 바꾸면 규칙도 같이 고칩니다.
- 버전 기준: Spring Boot 4.1.1 ↔ Spring AI 2.0.1. Boot 를 바꾸면 Spring AI 도 그 Boot 로 빌드된 버전으로 바꿉니다.

## 검증 (변경 후 필수)
```bash
scripts/verify-templates.sh               # 모든 조합 생성 + 빌드 + 테스트
scripts/verify-templates.sh base f-n      # 일부만 (조합 목록은 스크립트의 VARIANTS)
SKIP_ML=1 scripts/verify-templates.sh       # PyTorch 설치(ml) 생략
SKIP_BACKEND=1 scripts/verify-templates.sh  # Gradle 생략 빠른 확인
DOCKER_BUILD=1 scripts/verify-templates.sh all  # Docker 이미지 빌드까지 (Dockerfile, nginx 를 고쳤을 때)
```
