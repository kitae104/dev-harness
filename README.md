# dev-harness

늘 비슷한 형태로 시작하는 프로젝트를 위한 템플릿과 Claude Code 하네스 모음입니다.

## 템플릿

| 템플릿 | 명령 (예정) | 내용 | 상태 |
| --- | --- | --- | --- |
| [`templates/s-r`](templates/s-r) | `/s-r-setup` | Spring Boot + React(Tailwind), JWT 로그인·회원가입, 랜딩, Docker Compose | ✅ |
| `templates/s-r` + FastAPI 모듈 | `/s-r-f-setup` | 기본 템플릿 + FastAPI 서비스 | 예정 |
| `templates/s-r` + Spring AI 모듈 | `/s-r-ai-setup` | 기본 템플릿 + Spring AI | 예정 |

## 로드맵

1. 기본 템플릿 `templates/s-r`
2. 확장 모듈 (FastAPI, Spring AI) — 기본 템플릿 위에 덧붙이는 방식
3. 스킬 명령 (`.claude/skills/`) — 템플릿을 새 프로젝트 폴더로 복사하고 이름을 바꿔 줌
4. 하네스 규칙 — 생성된 프로젝트용 CLAUDE.md, 컨벤션, 테스트·린트 훅
