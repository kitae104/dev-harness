# Jupyter Lab 컨테이너 (make ml-up). ml/ 폴더를 /workspace 로 연결해 노트북과 코드를 바로 고칩니다.
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /uvx /bin/
WORKDIR /opt/ml
ENV UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never UV_PROJECT_ENVIRONMENT=/opt/ml/.venv

# 의존성만 먼저 설치 (PyTorch 가 커서 코드 변경 때 다시 받지 않도록). uv.lock 이 있으면 그대로 따릅니다.
COPY pyproject.toml uv.lock* ./
RUN if [ -f uv.lock ]; then uv sync --locked --no-dev --no-install-project; else uv sync --no-dev --no-install-project; fi

# 호스트 사용자와 같은 UID(기본 1000)로 실행해야 연결한 폴더에 파일을 쓸 수 있습니다.
ARG UID=1000
RUN useradd --create-home --uid ${UID} app && mkdir -p /workspace && chown app /workspace
USER app
ENV PATH="/opt/ml/.venv/bin:$PATH" PYTHONPATH=/workspace/src
WORKDIR /workspace
EXPOSE 8888
CMD ["sh", "-c", "jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --ServerApp.token=\"$JUPYTER_TOKEN\" --notebook-dir=/workspace"]
