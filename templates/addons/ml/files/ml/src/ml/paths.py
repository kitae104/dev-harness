from pathlib import Path

# ml/ 폴더 기준 경로. 노트북(ml/notebooks)이나 컨테이너(/workspace) 어디서 실행해도 같은 곳을 가리킵니다.
ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"  # 원본·가공 데이터 (git 에 올리지 않음)
MODELS_DIR = ROOT / "models"  # 학습한 모델 파일 (git 에 올리지 않음)
