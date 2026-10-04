# dev-harness

늘 비슷한 형태로 시작하는 프로젝트를 명령 하나로 만들고, 그 위에서 Claude Code 가 일관되게 기능을 추가하도록 규칙(하네스)까지 함께 넣어 주는 템플릿 모음입니다.

처음이라면 [docs/guide.html](docs/guide.html) (단계별 따라하기와 Claude Code 프롬프트 모음)을 브라우저로 열어 보세요.

## 명령

모든 프로젝트에 랜딩·회원가입·로그인·대시보드(JWT), PostgreSQL 18, Docker Compose, 디자인 토큰 구조, Claude Code 하네스가 들어갑니다.

| 명령 | 백엔드 | 프론트엔드 | 추가 |
| --- | --- | --- | --- |
| `/s-r-setup <이름>` | Spring Boot 4.1 | React 19 (Vite) | |
| `/s-r-f-setup <이름>` | Spring Boot 4.1 | React 19 | FastAPI 보조 서비스 (`/api/py/**`, 같은 JWT) |
| `/s-r-ai-setup <이름> [openai\|anthropic\|ollama]` | Spring Boot 4.1 | React 19 | Spring AI 2.0.1 채팅 (`/api/ai/chat`, `/chat`) |
| `/next-setup <이름>` | Spring Boot 4.1 | Next.js 16 | |
| `/f-r-setup <이름>` | FastAPI | React 19 | |
| `/f-n-setup <이름>` | FastAPI | Next.js 16 | |
| `/ai-setup <이름> [openai\|anthropic\|ollama] [cpu\|cuda]` | FastAPI | React 19 (Next 선택 가능) | LLM 채팅 + 딥러닝 작업 공간 (PyTorch, Jupyter, GPU 선택) |
| `/stack-setup <이름> <원하는 구성>` | 골라서 | 골라서 | 확장 모듈 자유 조합 |

생성된 프로젝트는 바로 `make up` 으로 실행되고, 프로젝트마다 Compose 이름(`COMPOSE_PROJECT_NAME`)이 달라 같은 Docker 의 다른 프로젝트와 섞이지 않습니다. 디자인은 Google Stitch 등에서 가져와 `design/` 에 넣고 `/apply-design` 으로 적용합니다 (가이드의 "디자인 바꾸기").

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
  node scripts/new-project.mjs --name my-lab --backend fastapi --frontend next --addons llm,ml --ml-device cuda
  node scripts/new-project.mjs --list-addons      # 고를 수 있는 값
  ```

필요한 도구: Node 20+ (생성기), Docker (실행), 로컬 개발 시 JDK 17 이상(빌드용 JDK 21 은 Gradle 이 자동으로 받음) · uv(FastAPI, ml).
Windows 는 스킬 설치에 `install-skills.ps1` 을 쓰고, 생성된 프로젝트의 훅은 Git Bash 가 있으면 그대로 동작합니다.

## 생성된 프로젝트에 들어가는 것

- 앱: `backend/`(Spring Boot 또는 FastAPI), `frontend/`(React 또는 Next.js), 선택 시 `fastapi/`, AI 채팅(`ai/`), `ml/`
- 디자인: `frontend/src/styles/theme.css`(토큰), `frontend/src/components/ui/`(공통 컴포넌트), `design/`(Stitch 내보내기 등 원본), 직접 색 지정을 막는 `npm run lint`
- 실행: `docker-compose.yml`, `Makefile`(`up`/`down`/`ps`/`logs`/`db`/`clean`), 임의 `JWT_SECRET` 이 들어간 `.env`
- 하네스 (Claude Code 용)
  - `CLAUDE.md`: 구성, 명령, 작업 규칙
  - `.claude/rules/*.md`: 폴더별 규칙 (backend, frontend, design, docker, fastapi, spring-ai, ai, ml). 해당 파일을 다룰 때만 적용
  - `.claude/settings.json`: `.env` 읽기 금지, `make clean`·`git push` 등은 확인 후 실행
  - 훅: 파일 수정 직후 그 파일 린트(`lint-file.mjs`), 작업 종료 시 바뀐 영역 테스트(`verify.mjs`, 실패하면 Claude 가 이어서 고침)
  - 스킬: `/add-domain`(도메인 기능을 API부터 화면까지), `/apply-design`(디자인 적용), `/verify`(전체 검증)
  - 서브에이전트: `code-reviewer`
  - GitHub Actions `ci.yml`
- `.harness.json`: 어떤 백엔드·프론트엔드·확장 모듈·옵션으로 만들었는지 기록

## 저장소 구조

```
.claude/skills/            생성 명령 (SKILL.md + generate.mjs): s-r-*, next-setup, f-r-setup, f-n-setup, ai-setup, stack-setup
scripts/new-project.mjs    생성기 (의존성 없음)
scripts/verify-templates.sh  모든 조합을 생성해 빌드·테스트
scripts/install-skills.*   스킬을 ~/.claude/skills 에 연결
templates/s-r/             기본 템플릿 Spring Boot + React (그대로 실행 가능, 하네스 포함)
templates/stacks/backend-fastapi/   백엔드를 FastAPI 로 바꾸는 스택
templates/stacks/frontend-next/     프론트엔드를 Next.js 로 바꾸는 스택
templates/addons/fastapi/  FastAPI 보조 서비스 (Spring 백엔드용)
templates/addons/spring-ai/ Spring AI 채팅 (Spring 백엔드용, 제공자별 조각)
templates/addons/llm/      AI 채팅 (FastAPI 백엔드용)
templates/addons/chat-ui/  채팅 화면 (spring-ai, llm 이 함께 씀, 직접 고르지 않음)
templates/addons/ml/       딥러닝 작업 공간 (PyTorch, Jupyter)
```

### 스택 동작 방식

`--backend fastapi` 나 `--frontend next` 를 고르면 생성기가 기본 템플릿의 `backend/` 또는 `frontend/` 를 빼고 `templates/stacks/<부분>-<값>/files/` 를 넣습니다. 기본 템플릿의 공용 파일(compose, CI, README, CLAUDE.md, 랜딩 소개 등)에는 `@block:<이름>` ~ `@endblock` 구간이 있고, 스택의 `stack.json` 의 `blocks` 에 연결된 파일 내용으로 그 구간을 통째로 바꿉니다. 이름이 `backend-` 로 시작하는 block 은 백엔드 스택이, `frontend-` 는 프론트엔드 스택이 바꿉니다.

두 프론트엔드는 공용 경로(`src/api/client.ts`, `src/auth/AuthContext.tsx`, `src/components/ui/`, `src/styles/theme.css`, `src/config/site.ts`)를 같게 맞춰, 확장 모듈의 화면 파일 하나가 양쪽에서 동작합니다. 두 백엔드는 같은 API 계약(경로, camelCase JSON, 에러 형식, JWT)을 지켜 어떤 프론트엔드와도 짝이 됩니다.

### 확장 모듈 동작 방식

기본 템플릿의 파일 곳곳에 `@addon:<slot>` 주석 줄이 있습니다 (예: `docker-compose.yml` 의 `# @addon:compose-services`). 생성기는

1. `templates/s-r` 를 복사하고, 선택한 확장 모듈의 `files/` 를 그 위에 덮어쓴 뒤
2. 각 `@addon:<slot>` 줄을 확장 모듈 `addon.json` 의 `slots` 에 연결된 조각 파일 내용으로 바꾸고 (선택 안 했으면 줄 삭제)
3. 자리표시자 `com.example.app`, `AppApplication`, `app` 을 새 이름으로 바꿉니다.

조각 경로의 `{aiProvider}`, `{frontend}`, `{backend}` 처럼 옵션·스택 이름이 들어가면 선택한 값의 파일만 쓰입니다 (파일이 없으면 건너뜀). `files-<값>/` 폴더(예: `files-next/`)도 그 값을 골랐을 때만 들어갑니다. `addon.json` 의 `requires`(스택 조건), `includes`(함께 넣을 모듈), `hidden`(목록에서 숨김)으로 조합 규칙을 정합니다.

## 버전 기준

| 항목 | 버전 | 비고 |
| --- | --- | --- |
| Spring Boot | 4.1.1 | Java 21, Gradle 9.8, Jackson 3 |
| PostgreSQL | 18 | `postgres:18-alpine` |
| Spring AI | 2.0.1 | Spring Boot 4.1.1 로 빌드된 버전. Boot 를 올리면 함께 올립니다 |
| React / Vite / Tailwind | 19 / 8 / 4 | |
| Next.js | 16.3 | App Router, standalone 출력 |
| FastAPI / Python | 0.142 / 3.13 | uv, SQLAlchemy 2.1, Alembic 1.20 |
| PyTorch | 2.x (설치 시 최신) | ml 작업 공간, Python 3.12, CPU 또는 CUDA 12.8 |

Spring Boot 버전을 바꿀 때는 `templates/addons/spring-ai/slots/gradle-ext.gradle` 의 `springAiVersion` 도 그 Boot 버전으로 빌드된 Spring AI 로 바꾸고 `scripts/verify-templates.sh` 로 확인합니다.
