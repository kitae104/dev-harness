package com.example.app.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai")
public record AiProperties(String systemPrompt) {
}
