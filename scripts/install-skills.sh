#!/usr/bin/env bash
# dev-harness 스킬(/s-r-setup, /s-r-f-setup, /s-r-ai-setup)을 어느 폴더에서나 쓸 수 있게
# ~/.claude/skills 에 심볼릭 링크로 설치합니다. 저장소를 git pull 하면 스킬도 함께 갱신됩니다.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
DEST="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills"
mkdir -p "$DEST"

for dir in "$REPO"/.claude/skills/s-r-*/; do
  name="$(basename "$dir")"
  target="$DEST/$name"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    echo "건너뜀: $target 이 이미 있고 링크가 아닙니다 (직접 확인 후 지우세요)"
    continue
  fi
  ln -sfn "${dir%/}" "$target"
  echo "설치: /$name -> ${dir%/}"
done
echo "완료. Claude Code 를 다시 시작하면 어느 폴더에서나 위 명령을 쓸 수 있습니다."
