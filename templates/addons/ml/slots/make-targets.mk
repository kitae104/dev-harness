.PHONY: ml-up ml-down ml-train ml-lab

ml-up:     ## Jupyter Lab 컨테이너 실행 (주소와 토큰은 .env 의 JUPYTER_PORT, JUPYTER_TOKEN)
	$(COMPOSE) --profile ml up -d --build jupyter

ml-down:   ## Jupyter Lab 컨테이너만 종료
	$(COMPOSE) --profile ml stop jupyter

ml-train:  ## 예제 모델 학습 (로컬, ml/models/digits.pt 저장)
	cd ml && uv run python -m ml.train

ml-lab:    ## Jupyter Lab 을 컨테이너 없이 로컬에서 실행
	cd ml && uv run jupyter lab
