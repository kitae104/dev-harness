---
paths:
  - "ml/**"
---

# 딥러닝 작업 공간 규칙 (`ml/`)

- 구조: `src/ml/paths.py`(DATA_DIR, MODELS_DIR) · `device.py`(get_device) · `data.py`(DataLoader 를 돌려주는 함수) · `model.py`(nn.Module) · `train.py`(train/evaluate/save/load + CLI). 새 실험은 같은 이름 규칙으로 파일을 추가합니다 (예: `data_reviews.py`, `model_bert.py`, `train_reviews.py`).
- 재현성: 학습 함수는 시드를 고정하고(`torch.manual_seed`), 하이퍼파라미터는 함수 인자와 CLI 옵션(argparse)으로 받습니다. 코드 안에 숫자를 흩어 두지 않습니다.
- 장치: `get_device()` 로 정하고 텐서·모델을 `.to(device)` 로 옮깁니다. 저장은 `state_dict` 를 CPU 기준으로(`map_location="cpu"`), 불러올 때 `weights_only=True`.
- 노트북: 탐색과 시각화만. 재사용할 코드는 `src/ml/` 로 옮기고 노트북은 import 합니다. 노트북 출력에 비밀값이나 큰 데이터를 남기지 않습니다.
- 데이터·모델 파일은 git 에 올리지 않습니다 (`ml/data/`, `ml/models/`). 내려받는 코드는 `data.py` 에 두고 `DATA_DIR` 아래에 저장합니다.
- 테스트: `tests/test_<기능>.py`. 작은 데이터(`limit`)와 1~3 epoch 로 "학습이 돌아가고 성능이 기준 이상"인지, 저장·불러오기가 같은 결과를 내는지 확인합니다. GPU 없이도 통과해야 합니다.
- 서비스 연결: 학습한 모델을 API 로 내보낼 때는 ONNX 로 내보내고 백엔드에 `onnxruntime` 으로 추론하는 라우터를 둡니다. 백엔드에 PyTorch 를 넣지 않습니다. 큰 모델(LLM 등)은 Ollama·vLLM 같은 별도 서버로 띄우고 HTTP 로 부릅니다.
- 의존성: `uv add <패키지>`. PyTorch 는 `pyproject.toml` 의 `[[tool.uv.index]]` 주소(CPU 또는 CUDA)에서 받습니다.
- 검증: `cd ml && uv run ruff check . && uv run ruff format --check . && uv run pytest -q`
