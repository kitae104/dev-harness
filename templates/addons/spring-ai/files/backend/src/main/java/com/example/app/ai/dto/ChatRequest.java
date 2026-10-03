package com.example.app.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequest(
        @NotBlank(message = "메시지를 입력해 주세요.")
        @Size(max = 4000, message = "메시지는 4000자 이하로 입력해 주세요.")
        String message) {
}
