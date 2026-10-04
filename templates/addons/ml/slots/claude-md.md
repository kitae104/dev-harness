### 딥러닝 작업 공간 (`ml/`)

- 실험 코드는 `ml/src/ml/` 에 두고 노트북은 그것을 import 해서 씁니다. 노트북에만 있는 긴 코드는 굳으면 `src/ml/` 로 옮기고 테스트를 붙입니다.
- 데이터는 `ml/data/`, 모델 파일은 `ml/models/` (둘 다 git 제외). 경로는 `ml.paths` 를 씁니다.
- 장치는 `ml.device.get_device()` 로만 고릅니다. `"cuda"` 를 하드코딩하지 않습니다.
- 의존성 추가는 `cd ml && uv add <패키지>` (pyproject.toml 과 uv.lock 커밋). 웹 백엔드에 PyTorch 를 넣지 않습니다.
- 검증: `cd ml && uv run ruff check . && uv run pytest -q`
- 세부 규칙: `.claude/rules/ml.md`
