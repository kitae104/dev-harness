#!/usr/bin/env bash
# 템플릿 조합을 실제로 생성해 빌드·테스트까지 확인합니다. 템플릿을 고친 뒤 반드시 실행하세요.
#
#   scripts/verify-templates.sh                 # 모든 조합
#   scripts/verify-templates.sh base fastapi    # 일부만 (base | fastapi | ai-openai | ai-anthropic | ai-ollama | all)
#   SKIP_BACKEND=1 scripts/verify-templates.sh  # Gradle 테스트 생략 (빠른 확인)
#   DOCKER_BUILD=1 scripts/verify-templates.sh all  # Docker 이미지 빌드까지 (Docker 데몬 필요)
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/dev-harness-verify.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

declare -A VARIANTS=(
  [base]=""
  [fastapi]="--addons fastapi"
  [ai-openai]="--addons spring-ai --ai-provider openai"
  [ai-anthropic]="--addons spring-ai --ai-provider anthropic"
  [ai-ollama]="--addons spring-ai --ai-provider ollama"
  [all]="--addons fastapi,spring-ai"
)
ORDER=(base fastapi ai-openai ai-anthropic ai-ollama all)
SELECTED=("${@:-${ORDER[@]}}")

step() { printf '\n\033[1m== %s\033[0m\n' "$*"; }

for v in "${SELECTED[@]}"; do
  [ -n "${VARIANTS[$v]+x}" ] || { echo "알 수 없는 조합: $v"; exit 1; }
  dir="$WORK/$v"
  step "$v: 생성"
  # shellcheck disable=SC2086
  node "$REPO/scripts/new-project.mjs" --name "verify-$v" --package "com.verify.${v//-/}" --out "$dir" --no-git ${VARIANTS[$v]} > /dev/null

  step "$v: 남은 자리표시자 검사"
  if grep -rnE '@addon:|com\.example\.app|AppApplication' "$dir"; then
    echo "자리표시자가 남아 있습니다"; exit 1
  fi

  if command -v docker > /dev/null; then
    step "$v: docker compose config"
    (cd "$dir" && docker compose config -q)
  fi

  if [ -n "${DOCKER_BUILD:-}" ]; then
    step "$v: docker compose build"
    (cd "$dir" && docker compose build -q)
    docker image ls --format '{{.Repository}}' | grep "^verify-$v-" | xargs -r docker image rm > /dev/null || true
  fi

  if [ -z "${SKIP_BACKEND:-}" ]; then
    step "$v: backend ./gradlew test"
    (cd "$dir/backend" && ./gradlew test --no-daemon -q)
  fi

  step "$v: frontend lint + build"
  (cd "$dir/frontend" && npm ci --silent && npm run lint && npm run build > /dev/null)

  if [ -d "$dir/fastapi" ]; then
    step "$v: fastapi ruff + pytest"
    (cd "$dir/fastapi" && uv sync --locked -q && uv run ruff check . && uv run ruff format --check . && uv run pytest -q)
  fi
done

step "모든 조합 통과: ${SELECTED[*]}"
