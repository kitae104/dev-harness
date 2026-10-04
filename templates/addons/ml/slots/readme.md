## 딥러닝 작업 공간 (`ml/`)

PyTorch 실험·학습용 파이썬 프로젝트입니다. 웹 서비스(backend)와 의존성을 나눠, 무거운 라이브러리가 서비스 이미지에 들어가지 않게 했습니다.

```
ml/
├── src/ml/        # 실험 코드 (device, data, model, train). 노트북에서 import 해서 씀
├── notebooks/     # Jupyter 노트북 (01_quickstart.ipynb)
├── tests/         # 학습 코드 테스트
├── data/          # 데이터 (git 제외)
└── models/        # 학습한 모델 파일 (git 제외)
```

```bash
make ml-train      # 예제 모델 학습 (= cd ml && uv run python -m ml.train)
make ml-lab        # 로컬 Jupyter Lab
make ml-up         # Jupyter Lab 컨테이너 → http://localhost:8888/lab?token=<.env 의 JUPYTER_TOKEN>
make ml-down       # Jupyter 컨테이너만 종료 (make down 도 함께 내립니다)
cd ml && uv run pytest -q
```

- 처음 `uv sync`(또는 `make ml-train`)는 PyTorch 를 내려받느라 오래 걸립니다. 실행 후 생긴 `ml/uv.lock` 은 커밋하세요 (모두 같은 버전을 쓰게 됨).
- 장치는 자동으로 고릅니다: NVIDIA GPU(cuda) → Apple Silicon(mps) → CPU (`python -m ml.device` 로 확인).
- CPU 빌드와 GPU(CUDA) 빌드는 `ml/pyproject.toml` 의 PyTorch 주소(`[[tool.uv.index]]`)로 정해집니다. 바꾼 뒤 `uv lock` 을 다시 실행하세요. GPU 컨테이너는 NVIDIA Container Toolkit(Windows 는 Docker Desktop + WSL2)이 필요합니다.
- 학습한 모델을 서비스에 쓰려면 ONNX 로 내보내(`torch.onnx.export`) 백엔드에서 `onnxruntime` 으로 추론하는 방식을 권장합니다 (백엔드 이미지에 PyTorch 를 넣지 않음).
