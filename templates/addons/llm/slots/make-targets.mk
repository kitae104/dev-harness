.PHONY: ai-model ai-models

ai-model:  ## Ollama 모델 내려받기 (.env 의 OLLAMA_MODEL). Ollama 컨테이너가 꺼져 있으면 CPU 용으로 켭니다
	@svc=$$($(COMPOSE) ps --services --status running | grep -E '^ollama(-gpu)?$$' | head -n 1); \
	if [ -z "$$svc" ]; then $(COMPOSE) --profile ollama up -d ollama && svc=ollama; fi; \
	$(COMPOSE) exec $$svc sh -c 'ollama pull "$$OLLAMA_MODEL"'

ai-models: ## 내려받은 Ollama 모델 목록
	@svc=$$($(COMPOSE) ps --services --status running | grep -E '^ollama(-gpu)?$$' | head -n 1); \
	if [ -z "$$svc" ]; then echo "Ollama 컨테이너가 꺼져 있습니다. make up 또는 make ai-model 을 먼저 실행하세요."; exit 1; fi; \
	$(COMPOSE) exec $$svc ollama list
