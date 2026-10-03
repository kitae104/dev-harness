---
name: s-r-setup
description: Spring Boot 4.1 + React(Tailwind) + PostgreSQL 18 프로젝트를 JWT 로그인·회원가입·랜딩 페이지와 Docker Compose 가 준비된 상태로 새로 만든다. "/s-r-setup 프로젝트이름" 또는 "스프링 리액트 프로젝트 새로 만들어줘" 같은 요청에 사용.
argument-hint: "<프로젝트이름> [패키지] [위치]"
---

# Spring Boot + React 프로젝트 생성

기본 템플릿 `templates/s-r` 로 새 프로젝트를 만듭니다: Spring Boot 4.1 (Java 21) + React 19 / Tailwind v4 + PostgreSQL 18, JWT 로그인·회원가입·랜딩, 프로젝트 단위 Docker Compose, Claude Code 하네스(CLAUDE.md, 규칙, 훅).

## 1. 입력 정하기

`$ARGUMENTS` 에서 아래 값을 읽습니다. **프로젝트 이름이 없을 때만** 사용자에게 묻고, 나머지는 기본값을 씁니다.

| 값 | 형식 | 기본값 |
| --- | --- | --- |
| 프로젝트 이름 | 소문자·숫자·하이픈 (예: `my-shop`). 한글이나 공백이 오면 영문 슬러그를 제안해 확인받기 | (필수) |
| Java 패키지 | `com.회사.이름` | `com.example.<이름에서 하이픈 제거>` |
| 생성 위치 | 폴더 경로 | 현재 폴더 아래 `<이름>` (dev-harness 저장소 안에서 실행하면 저장소 옆 `../<이름>`) |

예: `/s-r-setup my-shop`, `/s-r-setup my-shop com.kitae.shop ~/projects/my-shop`

## 2. 생성

이 스킬의 기본 디렉터리(Base directory)에 있는 `generate.mjs` 를 실행합니다.

```bash
node "<이 스킬의 기본 디렉터리>/generate.mjs" --name <이름> [--package <패키지>] [--out <위치>]
```

- 실패 메시지(✖)가 나오면 원인을 사용자에게 그대로 알리고 고칠 값을 묻습니다. 대상 폴더가 비어 있지 않다는 오류면 다른 위치를 제안합니다. 기존 폴더를 지우지 않습니다.
- Node 20 이상이 필요합니다. `node` 가 없으면 설치를 안내하고 멈춥니다.

## 3. 확인과 보고

1. 생성된 폴더에 `.harness.json`, `CLAUDE.md`, `docker-compose.yml` 가 있는지 확인합니다.
2. 사용자에게 짧게 보고합니다.
   - 만든 위치, 이름, 패키지
   - 실행: `cd <위치>` → `make up` (전체 스택) / `make down` (이 프로젝트만 종료). 화면 http://localhost:3000
   - 같은 PC에서 다른 프로젝트와 동시에 띄우려면 `.env` 의 포트(`DB_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`)를 바꾸라는 안내
   - 이후 기능 작업은 **생성된 폴더에서 Claude Code 를 새로 열어** 진행하라는 안내 (그 폴더의 CLAUDE.md, 규칙, 훅, `/add-domain`, `/verify` 가 적용됨)
3. 사용자가 원하면 이어서 `make up` 이나 `cd frontend && npm install` 을 실행해 줍니다. 묻지 않고 실행하지 않습니다.
