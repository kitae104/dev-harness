---
name: ai-setup
description: AI·딥러닝 프로젝트를 새로 만든다: FastAPI 백엔드 + React(또는 Next.js) + PostgreSQL 18, JWT 로그인·회원가입·랜딩, LLM 채팅 API와 화면(OpenAI·Anthropic·Ollama), PyTorch·Jupyter 딥러닝 작업 공간(GPU 선택). "/ai-setup 프로젝트이름" 또는 "AI 프로젝트 만들어줘", "딥러닝 프로젝트 세팅해줘" 같은 요청에 사용.
argument-hint: "<프로젝트이름> [위치] [openai|anthropic|ollama] [cpu|cuda] [next]"
---

# AI·딥러닝 프로젝트 생성

FastAPI 백엔드(`templates/stacks/backend-fastapi`)에 두 확장 모듈을 얹습니다.

- `llm`: `/api/ai/chat` 채팅 API(사용자별 대화 맥락)와 `/chat` 화면. 제공자 SDK 없이 HTTP 로 부르므로 `AI_PROVIDER` 환경 변수 하나로 OpenAI·Anthropic·Ollama(로컬, 무료)를 바꿉니다.
- `ml`: `ml/` 딥러닝 작업 공간. PyTorch, 예제 학습 코드(`python -m ml.train`), 노트북, Jupyter Lab 컨테이너(`make ml-up`), GPU(CUDA) 선택.

## 1. 입력 정하기

`$ARGUMENTS` 에서 아래 값을 읽습니다. **프로젝트 이름이 없을 때만** 사용자에게 묻고, 나머지는 기본값을 씁니다.

| 값 | 형식 | 기본값 |
| --- | --- | --- |
| 프로젝트 이름 | 소문자·숫자·하이픈 (예: `my-shop`). 한글이나 공백이 오면 영문 슬러그를 제안해 확인받기 | (필수) |
| 모델 제공자 | `openai` \| `anthropic` \| `ollama` | `openai`. "클로드", "Anthropic" → `anthropic`, "로컬", "무료", "Ollama" → `ollama` |
| PyTorch 장치 | `cpu` \| `cuda` | `cpu`. "GPU", "NVIDIA", "CUDA" 를 말하면 `cuda` |
| 프론트엔드 | `react` \| `next` | `react`. "Next" 를 말하면 `next` |
| 생성 위치 | 폴더 경로 | 현재 폴더 아래 `<이름>` (dev-harness 저장소 안에서 실행하면 저장소 옆 `../<이름>`) |

채팅만 필요하면 `--addons llm`, 딥러닝 작업 공간만 필요하면 `--addons ml` 을 덧붙입니다 (뒤에 준 값이 기본값을 대신합니다).

## 2. 생성

이 스킬 폴더의 `generate.mjs` 를 실행합니다. `${CLAUDE_SKILL_DIR}` 가 이 스킬 폴더 경로로 바뀌어 보입니다 (바뀌지 않았다면 스킬을 불러올 때 안내된 Base directory 를 쓰세요).

```bash
node "${CLAUDE_SKILL_DIR}/generate.mjs" --name <이름> [--ai-provider <제공자>] [--ml-device cpu|cuda] [--frontend next] [--out <위치>]
```

- 실패 메시지(✖)가 나오면 원인을 사용자에게 그대로 알리고 고칠 값을 묻습니다. 대상 폴더가 비어 있지 않다는 오류면 다른 위치를 제안합니다. 기존 폴더를 지우지 않습니다.
- Node 20 이상이 필요합니다. `node` 가 없으면 설치를 안내하고 멈춥니다.

## 3. 확인과 보고

1. 생성된 폴더에 `.harness.json`, `backend/app/ai/router.py`, `ml/pyproject.toml` 가 있는지 확인합니다.
2. 사용자에게 짧게 보고합니다.
   - 만든 위치, 이름, 구성(백엔드·프론트엔드·확장 모듈), 넣어야 할 설정(`.env` 의 `OPENAI_API_KEY` 또는 `ANTHROPIC_API_KEY`, Ollama 는 `make ai-model`), 딥러닝 시작 방법(`make ml-train`, `make ml-up` 후 http://localhost:8888 과 `.env` 의 `JUPYTER_TOKEN`), 처음 `uv sync` 는 PyTorch 내려받기로 오래 걸린다는 점
   - 실행: `cd <위치>` → `make up` (전체 스택) / `make down` (이 프로젝트만 종료). 화면 http://localhost:3000 (랜딩, 회원가입, 로그인, 대시보드)
   - 같은 PC에서 다른 프로젝트와 동시에 띄우려면 `.env` 의 포트(`DB_PORT`, `BACKEND_PORT`, `FRONTEND_PORT` …)를 바꾸라는 안내
   - 디자인은 `design/` 에 Stitch 내보내기 등을 넣고 `/apply-design` 으로 적용한다는 안내
   - 이후 기능 작업은 **생성된 폴더에서 Claude Code 를 새로 열어** 진행하라는 안내 (그 폴더의 CLAUDE.md, 규칙, 훅, `/add-domain`, `/apply-design`, `/verify` 가 적용됨)
3. 사용자가 원하면 이어서 `make up` 이나 `cd frontend && npm install` 을 실행해 줍니다. 묻지 않고 실행하지 않습니다.
