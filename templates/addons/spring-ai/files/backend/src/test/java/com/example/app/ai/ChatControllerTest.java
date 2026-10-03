package com.example.app.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** 실제 모델 대신 ChatModel 을 목으로 바꿔 ChatClient → 컨트롤러 전체 흐름을 검증합니다. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ChatControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    ChatModel chatModel;

    String token;

    @BeforeEach
    void setUp() throws Exception {
        // ChatClient 는 모델의 기본 옵션을 복사해 요청을 만듭니다.
        given(chatModel.getOptions()).willReturn(ChatOptions.builder().build());

        String email = "ai-" + System.nanoTime() + "@example.com";
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", "password123", "name", "에이아이"))))
                .andExpect(status().isCreated());
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", "password123"))))
                .andReturn().getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(body);
        token = node.get("accessToken").asString();
    }

    @Test
    void chatReturnsModelReply() throws Exception {
        given(chatModel.call(any(Prompt.class)))
                .willReturn(new org.springframework.ai.chat.model.ChatResponse(
                        List.of(new Generation(new AssistantMessage("안녕하세요!")))));

        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("message", "hi"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("안녕하세요!"));

        ArgumentCaptor<Prompt> prompt = ArgumentCaptor.forClass(Prompt.class);
        verify(chatModel, times(1)).call(prompt.capture());
        assertThat(prompt.getValue().getContents()).contains("hi");
    }

    @Test
    void modelFailureBecomesBadGateway() throws Exception {
        given(chatModel.call(any(Prompt.class))).willThrow(new IllegalStateException("401 from provider"));

        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("message", "hi"))))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status").value(502));
    }

    @Test
    void blankMessageIsRejected() throws Exception {
        mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("message", " "))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.message").exists());
    }

    @Test
    void chatRequiresLogin() throws Exception {
        mockMvc.perform(post("/api/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("message", "hi"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void resetClearsConversation() throws Exception {
        mockMvc.perform(delete("/api/ai/chat").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
