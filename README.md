# dev-harness

늘 비슷한 형태로 시작하는 프로젝트를 명령 하나로 만들고, 그 위에서 Claude Code 가 일관되게 기능을 추가하도록 규칙(하네스)까지 함께 넣어 주는 템플릿 모음입니다.

처음이라면 [docs/guide.html](docs/guide.html) (단계별 따라하기와 Claude Code 프롬프트 모음)을 브라우저로 열어 보세요.

## 명령

| 명령 | 만들어지는 프로젝트 |
| --- | --- |
| `/s-r-setup <이름>` | Spring Boot 4.1 + React 19(Tailwind v4) + PostgreSQL 18, JWT 로그인·회원가입·랜딩, Docker Compose |
| `/s-r-f-setup <이름>` | 위 + FastAPI 서비스 (`/api/py/**`, 같은 JWT 로 인증) |
| `/s-r-ai-setup <이름> [openai\|anthropic\|ollama]` | 위 기본 + Spring AI 2.0.1 채팅 API·화면 (`/api/ai/chat`, `/chat`) |

생성된 프로젝트는 바로 `make up` 으로 실행되고, 프로젝트마다 Compose 이름(`COMPOSE_PROJECT_NAME`)이 달라 같은 Docker 의 다른 프로젝트와 섞이지 않습니다.

## 설치

```bash
git clone https://github.com/kitae104/dev-harness.git
cd dev-harness
```

- **이 폴더에서 Claude Code 실행**: 바로 `/s-r-setup my-shop` 사용. 프로젝트는 저장소 옆(`../my-shop`)에 만들어집니다.
- **어느 폴더에서나 쓰기**: 스킬을 사용자 스킬로 연결합니다. 이후 `git pull` 하면 스킬도 갱신됩니다.
  ```bash
  scripts/install-skills.sh                                          # macOS / Linux / Git Bash
  powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1   # Windows
  ```
- **Claude Code 없이**: 생성기를 직접 실행해도 같은 결과입니다.
  ```bash
  node scripts/new-project.mjs --name my-shop --package com.kitae.myshop --addons fastapi,spring-ai --ai-provider anthropic --out ~/projects/my-shop
  ```

필요한 도구: Node 20+ (생성기), Docker (실행), 로컬 개발 시 JDK 17 이상(빌드용 JDK 21 은 Gradle 이 자동으로 받음) · uv(FastAPI).
Windows 는 스킬 설치에 `install-skills.ps1` 을 쓰고, 생성된 프로젝트의 훅은 Git Bash 가 있으면 그대로 동작합니다.

## 생성된 프로젝트에 들어가는 것

- 앱: `backend/`(Spring Boot), `frontend/`(React), 선택 시 `fastapi/`, Spring AI 패키지 `ai/`
- 실행: `docker-compose.yml`, `Makefile`(`up`/`down`/`ps`/`logs`/`db`/`clean`), 임의 `JWT_SECRET` 이 들어간 `.env`
- 하네스 (Claude Code 용)
  - `CLAUDE.md`: 구성, 명령, 작업 규칙
  - `.claude/rules/*.md`: 폴더별 규칙 (backend, frontend, docker, fastapi, spring-ai). 해당 파일을 다룰 때만 적용
  - `.claude/settings.json`: `.env` 읽기 금지, `make clean`·`git push` 등은 확인 후 실행
  - 훅: 파일 수정 직후 그 파일 린트(`lint-file.mjs`), 작업 종료 시 바뀐 영역 테스트(`verify.mjs`, 실패하면 Claude 가 이어서 고침)
  - 스킬: `/add-domain`(도메인 기능을 API부터 화면까지), `/verify`(전체 검증)
  - 서브에이전트: `code-reviewer`
  - GitHub Actions `ci.yml`
- `.harness.json`: 어떤 템플릿·확장 모듈·옵션으로 만들었는지 기록

## 저장소 구조

```
.claude/skills/            /s-r-setup, /s-r-f-setup, /s-r-ai-setup (SKILL.md + generate.mjs)
scripts/new-project.mjs    생성기 (의존성 없음)
scripts/verify-templates.sh  모든 조합을 생성해 빌드·테스트
scripts/install-skills.*   스킬을 ~/.claude/skills 에 연결
templates/s-r/             기본 템플릿 (그대로 실행 가능, 하네스 포함)
templates/addons/fastapi/  FastAPI 확장 모듈
templates/addons/spring-ai/ Spring AI 확장 모듈 (제공자별 조각)
```

### 확장 모듈 동작 방식

기본 템플릿의 파일 곳곳에 `@addon:<slot>` 주석 줄이 있습니다 (예: `docker-compose.yml` 의 `# @addon:compose-services`). 생성기는

1. `templates/s-r` 를 복사하고, 선택한 확장 모듈의 `files/` 를 그 위에 덮어쓴 뒤
2. 각 `@addon:<slot>` 줄을 확장 모듈 `addon.json` 의 `slots` 에 연결된 조각 파일 내용으로 바꾸고 (선택 안 했으면 줄 삭제)
3. 자리표시자 `com.example.app`, `AppApplication`, `app` 을 새 이름으로 바꿉니다.

조각 경로의 `{aiProvider}` 처럼 옵션 이름이 들어가면 선택한 값의 파일만 쓰입니다 (파일이 없으면 건너뜀).

## 버전 기준

| 항목 | 버전 | 비고 |
| --- | --- | --- |
| Spring Boot | 4.1.1 | Java 21, Gradle 9.8, Jackson 3 |
| PostgreSQL | 18 | `postgres:18-alpine` |
| Spring AI | 2.0.1 | Spring Boot 4.1.1 로 빌드된 버전. Boot 를 올리면 함께 올립니다 |
| React / Vite / Tailwind | 19 / 8 / 4 | |
| FastAPI / Python | 0.142 / 3.13 | uv |

Spring Boot 버전을 바꿀 때는 `templates/addons/spring-ai/slots/gradle-ext.gradle` 의 `springAiVersion` 도 그 Boot 버전으로 빌드된 Spring AI 로 바꾸고 `scripts/verify-templates.sh` 로 확인합니다.
