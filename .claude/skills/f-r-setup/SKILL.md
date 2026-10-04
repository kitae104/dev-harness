---
name: f-r-setup
description: FastAPI(Python) 백엔드 + React 프론트엔드 + PostgreSQL 18 프로젝트를 JWT 로그인·회원가입·랜딩 페이지와 Docker Compose 가 준비된 상태로 새로 만든다. "/f-r-setup 프로젝트이름" 또는 "FastAPI 리액트 프로젝트 만들어줘" 같은 요청에 사용.
argument-hint: "<프로젝트이름> [위치]"
---

# FastAPI + React 프로젝트 생성

기본 템플릿 `templates/s-r` 의 백엔드를 `templates/stacks/backend-fastapi` (FastAPI, SQLAlchemy 2, Alembic, PyJWT, bcrypt, uv) 로 바꿔 새 프로젝트를 만듭니다. API 계약(경로, camelCase JSON, 에러 형식, JWT)은 Spring 버전과 같아서 React 화면이 그대로 동작합니다. AI·데이터 기능을 백엔드에 바로 붙이기 좋은 구성입니다.

## 1. 입력 정하기

`$ARGUMENTS` 에서 아래 값을 읽습니다. **프로젝트 이름이 없을 때만** 사용자에게 묻고, 나머지는 기본값을 씁니다.

| 값 | 형식 | 기본값 |
| --- | --- | --- |
| 프로젝트 이름 | 소문자·숫자·하이픈 (예: `my-shop`). 한글이나 공백이 오면 영문 슬러그를 제안해 확인받기 | (필수) |
| 생성 위치 | 폴더 경로 | 현재 폴더 아래 `<이름>` (dev-harness 저장소 안에서 실행하면 저장소 옆 `../<이름>`) |

AI 채팅이나 딥러닝 작업 공간도 원하면 `--addons llm`, `--addons ml` (둘 다면 `--addons llm,ml`, 이때는 `/ai-setup` 과 같음) 을 덧붙입니다. 프론트엔드를 Next.js 로 하려면 `/f-n-setup` 을 쓰세요.

## 2. 생성

이 스킬 폴더의 `generate.mjs` 를 실행합니다. `${CLAUDE_SKILL_DIR}` 가 이 스킬 폴더 경로로 바뀌어 보입니다 (바뀌지 않았다면 스킬을 불러올 때 안내된 Base directory 를 쓰세요).

```bash
node "${CLAUDE_SKILL_DIR}/generate.mjs" --name <이름> [--out <위치>]
```

- 실패 메시지(✖)가 나오면 원인을 사용자에게 그대로 알리고 고칠 값을 묻습니다. 대상 폴더가 비어 있지 않다는 오류면 다른 위치를 제안합니다. 기존 폴더를 지우지 않습니다.
- Node 20 이상이 필요합니다. `node` 가 없으면 설치를 안내하고 멈춥니다.

## 3. 확인과 보고

1. 생성된 폴더에 `.harness.json`, `CLAUDE.md`, `docker-compose.yml`, `backend/pyproject.toml` 가 있는지 확인합니다.
2. 사용자에게 짧게 보고합니다.
   - 만든 위치, 이름, 구성(백엔드·프론트엔드·확장 모듈), API 문서 http://localhost:8080/api/docs, 로컬 개발에 uv 가 필요하다는 점
   - 실행: `cd <위치>` → `make up` (전체 스택) / `make down` (이 프로젝트만 종료). 화면 http://localhost:3000 (랜딩, 회원가입, 로그인, 대시보드)
   - 같은 PC에서 다른 프로젝트와 동시에 띄우려면 `.env` 의 포트(`DB_PORT`, `BACKEND_PORT`, `FRONTEND_PORT` …)를 바꾸라는 안내
   - 디자인은 `design/` 에 Stitch 내보내기 등을 넣고 `/apply-design` 으로 적용한다는 안내
   - 이후 기능 작업은 **생성된 폴더에서 Claude Code 를 새로 열어** 진행하라는 안내 (그 폴더의 CLAUDE.md, 규칙, 훅, `/add-domain`, `/apply-design`, `/verify` 가 적용됨)
3. 사용자가 원하면 이어서 `make up` 이나 `cd frontend && npm install` 을 실행해 줍니다. 묻지 않고 실행하지 않습니다.
