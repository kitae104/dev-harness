# 프로젝트

로그인, 회원가입, 랜딩 페이지가 준비된 상태로 시작하는 프로젝트입니다. [dev-harness](https://github.com/kitae104/dev-harness) 템플릿으로 생성했습니다 (`.harness.json`).

## 구성

| 구분 | 기술 |
| --- | --- |
<!-- @block:backend-readme-row -->
| backend | Spring Boot 4.1, Java 21, Gradle, Spring Security, JWT (jjwt), JPA |
<!-- @endblock -->
<!-- @block:frontend-readme-row -->
| frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router |
<!-- @endblock -->
| 디자인 | 디자인 토큰(`frontend/src/styles/theme.css`) + 공통 UI 컴포넌트, `/apply-design` 으로 Stitch 등 외부 디자인 적용 |
| db | PostgreSQL 18 |
| 실행 | Docker Compose |

## 바로 실행 (Docker Compose)

```bash
make up                # = docker compose up -d --build
make down              # = docker compose down  (DB 데이터는 유지)
```

- `.env` 는 생성할 때 임의의 `JWT_SECRET` 으로 이미 만들어져 있습니다. **`.env.example` 로 덮어쓰지 마세요** (공개된 기본 비밀값이 됩니다). `.env` 가 없을 때만 `cp .env.example .env` 후 `JWT_SECRET` 을 바꾸세요 (`openssl rand -base64 48`).
- `JWT_SECRET` 이 비어 있으면 `docker compose` 가 시작하지 않고 알려 줍니다.

<!-- @block:frontend-readme-url -->
- 프론트엔드: http://localhost:3000 (nginx 가 `/api` 를 백엔드로 프록시)
<!-- @endblock -->
<!-- @block:backend-readme-url -->
- 백엔드: http://localhost:8080 (`/actuator/health`)
<!-- @endblock -->

### 다른 프로젝트와 함께 쓸 때

- 컨테이너(`<이름>-db`, `<이름>-backend`, `<이름>-frontend`), 네트워크(`<이름>-net`), 볼륨(`<이름>-db-data`)이 모두 `COMPOSE_PROJECT_NAME` 으로 시작합니다. 프로젝트마다 이름을 다르게 두면 서로 섞이지 않습니다.
- `make up` / `make down` 은 이 프로젝트의 컨테이너만 올리고 내립니다. 다른 프로젝트 컨테이너는 건드리지 않습니다.
- 동시에 여러 프로젝트를 띄우려면 `.env` 의 `DB_PORT`, `BACKEND_PORT`, `FRONTEND_PORT` 를 겹치지 않게 바꾸세요. 포트는 `127.0.0.1` 에만 열립니다.
- `make clean` 은 이 프로젝트의 DB 볼륨과 이미지까지 지웁니다 (데이터 초기화).
- `make` 가 없으면 주석에 적힌 `docker compose` 명령을 그대로 쓰면 됩니다.

## 로컬 개발

```bash
# 1) DB 만 컨테이너로
make db              # = docker compose up -d db

# @block:backend-readme-dev
# 2) 백엔드 (http://localhost:8080)
cd backend && ./gradlew bootRun
# @endblock

# @block:frontend-readme-dev
# 3) 프론트엔드 (http://localhost:5173, /api 는 8080 으로 프록시)
cd frontend && npm install && npm run dev
# @endblock
```

- `make` 가 없으면 Makefile 주석의 `docker compose` 명령을 그대로 쓰면 됩니다.
<!-- @block:backend-readme-dev-notes -->
- Windows(PowerShell/cmd)에서는 `./gradlew` 대신 `gradlew.bat` 을 씁니다.
- `./gradlew bootRun` 은 `.env` 를 읽지 않습니다. `.env` 에서 `DB_PORT` 를 바꿨다면 `DB_URL=jdbc:postgresql://localhost:<DB_PORT>/<DB_NAME>` 을 함께 지정해서 실행하세요.
- Gradle 실행에는 JDK 17 이상이 필요합니다. 컴파일용 JDK 21 이 없으면 Gradle 이 자동으로 내려받습니다 (foojay 툴체인).
<!-- @endblock -->

## 검증 명령

```bash
# @block:backend-readme-verify
cd backend && ./gradlew test        # H2 메모리 DB로 인증 API 통합 테스트
# @endblock
cd frontend && npm run lint && npm run build   # lint 에는 디자인 규칙 검사(직접 색 지정 금지)가 포함됩니다
```

## API

| 메서드 | 경로 | 인증 | 설명 |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | - | 회원가입 `{ email, password, name }` → 201 |
| POST | `/api/auth/login` | - | 로그인 `{ email, password }` → `{ accessToken, tokenType, expiresIn, user }` |
| GET | `/api/users/me` | Bearer | 내 정보 |
<!-- @block:backend-readme-health -->
| GET | `/actuator/health` | - | 헬스 체크 |
<!-- @endblock -->

에러 응답은 모두 `{ status, message, errors, timestamp }` 형식입니다 (`errors` 는 필드별 검증 메시지).

## 구조

```
# @block:backend-readme-tree
backend/src/main/java/com/example/app/
├── auth/        # 회원가입·로그인 (AuthController, AuthService, dto)
├── user/        # User 엔티티, 저장소, /api/users/me
├── security/    # JWT 발급·검증, 인증 필터, UserDetailsService
├── config/      # SecurityConfig, CORS 설정
└── common/      # ApiException, 전역 예외 처리
# @endblock

# @block:frontend-readme-tree
frontend/src/
├── api/         # fetch 래퍼(client.ts), 인증 API
├── auth/        # AuthContext(토큰 보관, 사용자 복원), ProtectedRoute
├── components/  # Layout(헤더/푸터)
│   └── ui/      # Button, Card, Input, FormField, Alert, Badge (디자인 토큰만 사용)
├── config/      # site.ts (서비스 이름, 소개 문구)
├── styles/      # theme.css (디자인 토큰)
└── pages/       # Landing, Login, Signup, Dashboard(보호됨), NotFound
# @endblock

design/          # 디자인 원본 (Stitch 내보내기, 참고 이미지)
```

## 새 기능을 추가할 때

<!-- @block:backend-readme-howto -->
- 백엔드: 도메인별 패키지(`com.example.app.<도메인>`)를 만들고 Controller → Service → Repository 순으로 둡니다. 인증이 필요 없는 경로는 `SecurityConfig` 의 `permitAll` 에 추가합니다.
<!-- @endblock -->
<!-- @block:frontend-readme-howto -->
- 프론트엔드: API 호출은 `src/api/<도메인>.ts` 에 두고 `api()` 래퍼를 사용합니다 (토큰 자동 첨부). 로그인이 필요한 페이지는 `App.tsx` 에서 `ProtectedRoute` 아래에 둡니다.
<!-- @endblock -->
- Claude Code 에서는 `/add-domain 게시글(제목, 내용)` 처럼 요청하면 백엔드부터 화면까지 한 번에 만듭니다.

## 디자인 바꾸기

화면의 색·글꼴·모서리·그림자는 모두 `frontend/src/styles/theme.css` 의 토큰 값에서 나옵니다. 화면 코드는 토큰 클래스(`bg-primary`, `text-muted-foreground`, `rounded-card` …)와 `src/components/ui/` 컴포넌트만 쓰므로, 토큰 값만 바꿔도 전체 화면이 바뀝니다.

1. **색만 바꾸기**: `theme.css` 의 `--primary` 등 값을 고칩니다. tweakcn(https://tweakcn.com) 같은 shadcn 테마 도구에서 만든 CSS 변수는 이름이 같아 그대로 붙여 넣을 수 있습니다.
2. **Google Stitch 디자인 적용**: Stitch 에서 내보낸 파일(HTML 코드, 화면 이미지)을 `design/stitch/` 에 넣고 Claude Code 에서 `/apply-design` 을 실행합니다. 토큰을 먼저 옮기고, 화면은 기존 기능(로그인, API 호출)을 유지한 채 구조와 스타일만 바꿉니다.
3. 자세한 방법: `design/README.md`

`npm run lint` 가 화면 코드의 직접 색 지정(`bg-blue-500`, `#3b82f6` 등)을 찾아 알려 줍니다.

## 버전 기준

이 템플릿의 기준 버전입니다. 확장 모듈(예: Spring AI)은 이 버전에 맞춰 고릅니다.

<!-- @block:backend-readme-versions -->
- Spring Boot 4.1.1 (Spring Framework 7, Jackson 3), Java 21, Gradle 9.8
<!-- @endblock -->
- PostgreSQL 18
<!-- @block:frontend-readme-versions -->
- React 19, Vite 8, Tailwind CSS 4
<!-- @endblock -->

## 참고

- 액세스 토큰만 사용하며 `localStorage` 에 저장합니다. 리프레시 토큰은 포함하지 않았습니다.
<!-- @block:backend-readme-notes -->
- 스키마는 `JPA_DDL_AUTO=update` 로 자동 생성됩니다. 운영 전에는 Flyway 같은 마이그레이션 도구로 바꾸는 것을 권장합니다.
<!-- @endblock -->

<!-- @addon:readme -->

## Claude Code 하네스

이 프로젝트에는 Claude Code 가 일관되게 기능을 추가하도록 돕는 설정이 들어 있습니다.

| 파일 | 역할 |
| --- | --- |
| `CLAUDE.md` | 구성, 명령, 작업 규칙 (Claude 가 매번 읽음) |
| `.claude/rules/*.md` | 폴더별 세부 규칙. 해당 파일을 다룰 때만 적용 (backend, frontend, design, docker …) |
| `.claude/settings.json` | 권한(.env 읽기 금지, 위험 명령은 확인)과 훅 |
| `.claude/hooks/lint-file.mjs` | 파일 수정 직후 그 파일만 린트 (oxlint, ruff) |
| `.claude/hooks/verify.mjs` | 작업을 끝낼 때 바뀐 영역의 테스트·린트 실행, 실패하면 Claude 가 이어서 고침 |
| `.claude/skills/add-domain` | `/add-domain 게시글(제목, 내용)` 처럼 도메인 기능을 백엔드~화면까지 추가 |
| `.claude/skills/verify` | `/verify` 전체 검증 후 표로 보고 |
| `.claude/skills/apply-design` | `/apply-design` 으로 `design/` 의 디자인(Stitch 등)을 토큰과 화면에 적용 |
| `.claude/agents/code-reviewer.md` | 규칙 기준 코드 리뷰 서브에이전트 |
| `.github/workflows/ci.yml` | GitHub Actions 에서 같은 검증 실행 |

- 훅은 Node 로 동작합니다 (Windows 는 Git Bash 필요). 검증 훅을 잠시 끄려면 `HARNESS_VERIFY=off claude`.
- 규칙을 바꾸고 싶으면 `CLAUDE.md` 나 `.claude/rules/` 를 직접 고치면 됩니다. 이후 Claude 의 작업에 바로 반영됩니다.
