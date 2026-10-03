package com.example.app.ai;

import com.example.app.ai.dto.ChatRequest;
import com.example.app.ai.dto.ChatResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/chat")
    public ChatResponse chat(@AuthenticationPrincipal UserDetails principal, @Valid @RequestBody ChatRequest request) {
        return chatService.chat(principal.getUsername(), request.message());
    }

    @DeleteMapping("/chat")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reset(@AuthenticationPrincipal UserDetails principal) {
        chatService.reset(principal.getUsername());
    }
}
