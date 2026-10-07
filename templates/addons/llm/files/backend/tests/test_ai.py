from collections.abc import Iterator

import httpx
import pytest
from fastapi.testclient import TestClient

from app.ai import service
from app.ai.config import AiSettings, get_ai_settings
from app.ai.providers import AnthropicModel, Message, ModelError, OpenAICompatibleModel, get_chat_model
from app.main import app


class FakeModel:
    """실제 모델 대신 받은 메시지를 기록하고 정해진 답을 돌려줍니다."""

    def __init__(self, reply: str = "안녕하세요!", fail: bool = False) -> None:
        self.reply = reply
        self.fail = fail
        self.calls: list[list[Message]] = []

    def complete(self, system: str, messages: list[Message], *, json_mode: bool = False) -> str:
        self.calls.append(messages)
        if self.fail:
            raise ModelError("테스트 실패")
        return self.reply


@pytest.fixture
def model(client: TestClient) -> Iterator[FakeModel]:
    fake = FakeModel()
    app.dependency_overrides[get_chat_model] = lambda: fake
    yield fake
    service.memory = service.ChatMemory()


def test_chat_replies_and_keeps_history(client, auth_headers, model):
    res = client.post("/api/ai/chat", json={"message": "첫 질문"}, headers=auth_headers)
    assert res.status_code == 200, res.text
    assert res.json() == {"reply": "안녕하세요!"}

    client.post("/api/ai/chat", json={"message": "두 번째"}, headers=auth_headers)
    assert [m["content"] for m in model.calls[-1]] == ["첫 질문", "안녕하세요!", "두 번째"]


def test_reset_clears_history(client, auth_headers, model):
    client.post("/api/ai/chat", json={"message": "기억해"}, headers=auth_headers)
    assert client.delete("/api/ai/chat", headers=auth_headers).status_code == 204
    client.post("/api/ai/chat", json={"message": "새 대화"}, headers=auth_headers)
    assert [m["content"] for m in model.calls[-1]] == ["새 대화"]


def test_chat_requires_login(client, model):
    assert client.post("/api/ai/chat", json={"message": "hi"}).status_code == 401


def test_chat_validation(client, auth_headers, model):
    res = client.post("/api/ai/chat", json={"message": "  "}, headers=auth_headers)
    assert res.status_code == 400
    assert res.json()["errors"]["message"] == "메시지를 입력해 주세요."


def test_model_failure_is_502(client, auth_headers, model):
    model.fail = True
    res = client.post("/api/ai/chat", json={"message": "hi"}, headers=auth_headers)
    assert res.status_code == 502
    assert "AI 응답을 받지 못했습니다" in res.json()["message"]


def test_history_is_limited(client, auth_headers, model):
    app.dependency_overrides[get_ai_settings] = lambda: AiSettings(ai_history_size=4)
    for i in range(5):
        client.post("/api/ai/chat", json={"message": f"q{i}"}, headers=auth_headers)
    assert len(model.calls[-1]) == 5  # 지난 4개 + 이번 질문


def test_openai_compatible_request_shape(monkeypatch):
    seen = {}

    def fake_post(url, headers, json, timeout):
        seen.update(url=url, headers=headers, json=json)
        return httpx.Response(200, json={"choices": [{"message": {"content": "답"}}]})

    monkeypatch.setattr(httpx, "post", fake_post)
    model = OpenAICompatibleModel("http://x/v1/", "key", "m", AiSettings())
    assert model.complete("sys", [{"role": "user", "content": "q"}]) == "답"
    assert seen["url"] == "http://x/v1/chat/completions"
    assert seen["headers"]["Authorization"] == "Bearer key"
    assert seen["json"]["messages"][0] == {"role": "system", "content": "sys"}


def test_anthropic_request_shape(monkeypatch):
    seen = {}

    def fake_post(url, headers, json, timeout):
        seen.update(url=url, headers=headers, json=json)
        return httpx.Response(200, json={"content": [{"type": "text", "text": "답"}]})

    monkeypatch.setattr(httpx, "post", fake_post)
    model = AnthropicModel(AiSettings(anthropic_api_key="key"))
    assert model.complete("sys", [{"role": "user", "content": "q"}]) == "답"
    assert seen["url"].endswith("/v1/messages")
    assert seen["headers"]["x-api-key"] == "key"
    assert seen["json"]["system"] == "sys"


def test_missing_key_raises_model_error():
    with pytest.raises(ModelError):
        OpenAICompatibleModel("http://x/v1", "", "m", AiSettings()).complete("s", [])


def test_provider_http_error(monkeypatch):
    monkeypatch.setattr(httpx, "post", lambda *a, **k: httpx.Response(401, text="bad key"))
    with pytest.raises(ModelError):
        AnthropicModel(AiSettings(anthropic_api_key="key")).complete("s", [])


def test_json_mode_asks_for_json_object(monkeypatch):
    seen = {}

    def fake_post(url, headers, json, timeout):
        seen.update(json=json)
        return httpx.Response(200, json={"choices": [{"message": {"content": '{"a": 1}'}}]})

    monkeypatch.setattr(httpx, "post", fake_post)
    model = OpenAICompatibleModel("http://x/v1", "key", "m", AiSettings())
    assert model.complete("sys", [{"role": "user", "content": "q"}], json_mode=True) == '{"a": 1}'
    assert seen["json"]["response_format"] == {"type": "json_object"}
    assert "JSON" in seen["json"]["messages"][0]["content"]


def test_think_block_is_removed(monkeypatch):
    content = "<think>\n먼저 생각해 보면...\n</think>\n\n답입니다"
    monkeypatch.setattr(
        httpx, "post", lambda *a, **k: httpx.Response(200, json={"choices": [{"message": {"content": content}}]})
    )
    assert OpenAICompatibleModel("http://x/v1", "key", "m", AiSettings()).complete("s", []) == "답입니다"


def test_ollama_uses_openai_compatible_endpoint(monkeypatch):
    seen = {}

    def fake_post(url, headers, json, timeout):
        seen.update(url=url, json=json)
        return httpx.Response(200, json={"choices": [{"message": {"content": "답"}}]})

    monkeypatch.setattr(httpx, "post", fake_post)
    settings = AiSettings(ai_provider="ollama", ollama_base_url="http://ollama:11434", ollama_model="gemma3:4b")
    assert get_chat_model(settings).complete("s", []) == "답"
    assert seen["url"] == "http://ollama:11434/v1/chat/completions"
    assert seen["json"]["model"] == "gemma3:4b"


def test_missing_ollama_model_hint(monkeypatch):
    monkeypatch.setattr(httpx, "post", lambda *a, **k: httpx.Response(404, text='{"error":"model \'x\' not found"}'))
    with pytest.raises(ModelError, match="make ai-model"):
        get_chat_model(AiSettings(ai_provider="ollama")).complete("s", [])
