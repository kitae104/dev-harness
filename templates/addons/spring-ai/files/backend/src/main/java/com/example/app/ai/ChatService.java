package com.example.app.ai;

import com.example.app.ai.dto.ChatResponse;
import com.example.app.common.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatClient chatClient;
    private final ChatMemory chatMemory;

    /** conversationId 별로 대화 맥락을 이어갑니다. 여기서는 사용자 이메일을 그대로 씁니다. */
    public ChatResponse chat(String conversationId, String message) {
        String reply;
        try {
            reply = chatClient.prompt()
                    .user(message)
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                    .call()
                    .content();
        } catch (RuntimeException e) {
            log.warn("AI 모델 호출 실패: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI 응답을 받지 못했습니다. 모델 설정(API 키, 모델 이름)을 확인해 주세요.");
        }
        return new ChatResponse(reply == null ? "" : reply);
    }

    public void reset(String conversationId) {
        chatMemory.clear(conversationId);
    }
}
