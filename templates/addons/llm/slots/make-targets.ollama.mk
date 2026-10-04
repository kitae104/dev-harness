.PHONY: ai-model

ai-model:  ## Ollama 모델 내려받기 (처음 한 번, .env 의 OLLAMA_MODEL)
	$(COMPOSE) up -d ollama
	$(COMPOSE) exec ollama sh -c 'ollama pull "$$OLLAMA_MODEL"'
