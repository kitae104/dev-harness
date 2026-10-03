package com.example.app.ai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    /** 사용자별 최근 대화를 메모리에 보관합니다. 서버를 재시작하면 사라집니다. */
    @Bean
    public ChatMemory chatMemory() {
        return MessageWindowChatMemory.builder().maxMessages(20).build();
    }

    /** 모델 제공자(OpenAI, Anthropic, Ollama)와 무관한 ChatClient. 제공자는 build.gradle 의 starter 로 정해집니다. */
    @Bean
    public ChatClient chatClient(ChatClient.Builder builder, AiProperties properties, ChatMemory chatMemory) {
        return builder
                .defaultSystem(properties.systemPrompt())
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build();
    }
}
