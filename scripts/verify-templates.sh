#!/usr/bin/env bash
# 템플릿 조합을 실제로 생성해 빌드·테스트까지 확인합니다. 템플릿을 고친 뒤 반드시 실행하세요.
#
#   scripts/verify-templates.sh                 # 모든 조합
#   scripts/verify-templates.sh base f-r        # 일부만 (조합 이름은 아래 VARIANTS)
#   SKIP_BACKEND=1 scripts/verify-templates.sh  # Gradle 테스트 생략 (빠른 확인)
#   SKIP_ML=1 scripts/verify-templates.sh       # ml/ (PyTorch 설치) 생략
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
  [next]="--frontend next"
  [next-all]="--frontend next --addons fastapi,spring-ai --ai-provider ollama"
  [f-r]="--backend fastapi"
  [f-n]="--backend fastapi --frontend next"
  [f-ai]="--backend fastapi --addons llm,ml"
  [f-ai-anthropic]="--backend fastapi --addons llm --ai-provider anthropic"
  [f-n-ai-ollama]="--backend fastapi --frontend next --addons llm,ml --ai-provider ollama"
  [ml-cuda]="--addons ml --ml-device cuda"
)
ORDER=(base fastapi ai-openai ai-anthropic ai-ollama all next next-all f-r f-n f-ai f-ai-anthropic f-n-ai-ollama ml-cuda)
SELECTED=("${@:-${ORDER[@]}}")

step() { printf '\n\033[1m== %s\033[0m\n' "$*"; }

for v in "${SELECTED[@]}"; do
  [ -n "${VARIANTS[$v]+x}" ] || { echo "알 수 없는 조합: $v"; exit 1; }
  dir="$WORK/$v"
  step "$v: 생성"
  # shellcheck disable=SC2086
  node "$REPO/scripts/new-project.mjs" --name "verify-$v" --package "com.verify.${v//-/}" --out "$dir" --no-git ${VARIANTS[$v]} > /dev/null

  step "$v: 남은 자리표시자 검사"
  if grep -rnE '@addon:|@block:|@endblock|com\.example\.app|AppApplication' "$dir"; then
    echo "자리표시자가 남아 있습니다"; exit 1
  fi

  if command -v docker > /dev/null; then
    step "$v: docker compose config"
    (cd "$dir" && docker compose config -q)
  fi

  if [ -n "${DOCKER_BUILD:-}" ]; then
    step "$v: docker compose build"
    (cd "$dir" && docker compose --profile "*" build -q)
    docker image ls --format '{{.Repository}}' | grep "^verify-$v-" | xargs -r docker image rm > /dev/null || true
  fi

  if [ -z "${SKIP_BACKEND:-}" ] && [ -f "$dir/backend/gradlew" ]; then
    step "$v: backend ./gradlew test"
    (cd "$dir/backend" && ./gradlew test --no-daemon -q)
  fi

  step "$v: frontend lint + build"
  (cd "$dir/frontend" && npm ci --silent && npm run lint && npm run build > /dev/null)

  # 파이썬 프로젝트: FastAPI 백엔드, FastAPI 보조 서비스, ml 작업 공간
  for py in backend fastapi ml; do
    [ -f "$dir/$py/pyproject.toml" ] || continue
    if [ "$py" = ml ] && [ -n "${SKIP_ML:-}" ]; then echo "ml 생략 (SKIP_ML)"; continue; fi
    if [ "$py" = ml ] && grep -q 'whl/cu' "$dir/ml/pyproject.toml"; then
      # CUDA 빌드 PyTorch 는 수 GB 라 설치하지 않고 형식 검사만 합니다 (같은 코드를 CPU 조합에서 테스트).
      step "$v: ml (CUDA) ruff 만"
      (cd "$dir/ml" && uvx ruff check . && uvx ruff format --check .)
      continue
    fi
    step "$v: $py ruff + pytest"
    if [ -f "$dir/$py/uv.lock" ]; then sync=(uv sync --locked -q); else sync=(uv sync -q --no-group notebook); fi
    (cd "$dir/$py" && "${sync[@]}" && uv run ruff check . && uv run ruff format --check . && uv run pytest -q)
  done
done

step "모든 조합 통과: ${SELECTED[*]}"
