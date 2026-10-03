---
paths:
  - "docker-compose.yml"
  - "Makefile"
  - ".env.example"
  - "**/Dockerfile"
  - "frontend/nginx.conf"
---

# Docker 규칙

이 프로젝트는 다른 프로젝트와 같은 Docker 에서 돌아갑니다. 이 프로젝트의 스택은 하나의 단위로 올리고 내립니다.

- Compose 프로젝트 이름은 `.env` 의 `COMPOSE_PROJECT_NAME` 하나로 정해집니다 (`name: ${COMPOSE_PROJECT_NAME:-...}`).
- 새 서비스: `container_name: ${COMPOSE_PROJECT_NAME:-...}-<서비스>`, 직접 빌드하면 `image: ${COMPOSE_PROJECT_NAME:-...}-<서비스>`, 네트워크는 기존 `app-net` 만 사용.
- 새 볼륨: `name: ${COMPOSE_PROJECT_NAME:-...}-<용도>` 를 반드시 지정합니다.
- 포트: `"127.0.0.1:${<서비스>_PORT:-기본값}:<컨테이너 포트>"`. 변수는 `.env.example` 에도 추가합니다. 0.0.0.0 으로 열지 않습니다.
- 외부 `docker` 명령으로 이름 없는 리소스를 만들지 않고, 다른 프로젝트 리소스를 지우는 명령(`docker system prune`, `docker volume prune` 등)은 쓰지 않습니다.
- 프론트엔드에서 새 백엔드 서비스로 가는 경로가 필요하면 `frontend/nginx.conf` 와 `frontend/vite.config.ts` 의 프록시를 함께 추가합니다.
- `make` 대상을 추가하면 주석(`## 설명`)을 붙입니다.
- 확인: `docker compose config -q` (문법), `make up && make ps`.
