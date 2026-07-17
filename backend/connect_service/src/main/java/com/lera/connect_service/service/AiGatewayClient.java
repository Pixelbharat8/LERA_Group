package com.lera.connect_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Thin client that forwards the caller's bearer token to the AI Gateway (ai_gateway, 8087)
 * so Connect features (e.g. the AI tutor) get a REAL model answer instead of a canned string.
 * When the gateway has no provider key configured it reports {@code usingRealAI=false}; callers
 * must surface that honestly rather than presenting the fallback text as a real AI response.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiGatewayClient {

    private final RestTemplate restTemplate;

    @Value("${lera.ai-gateway.base-url:http://localhost:8087}")
    private String aiGatewayBaseUrl;

    /** @param usingRealAI true only when the gateway actually reached a configured provider. */
    public record AiReply(boolean usingRealAI, String message, String model, long tokensUsed) {}

    /** Ask the gateway's chat endpoint, forwarding the caller's JWT. Never throws. */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public AiReply chat(String bearerToken, String message, String systemPrompt) {
        String url = aiGatewayBaseUrl.replaceAll("/$", "") + "/api/ai/chat";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (bearerToken != null && !bearerToken.isBlank()) {
            headers.set("Authorization", bearerToken);
        }
        Map<String, Object> body = new HashMap<>();
        body.put("message", message);
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            body.put("systemPrompt", systemPrompt);
        }
        try {
            ResponseEntity<Map> resp = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
            Map<String, Object> b = resp.getBody();
            if (b != null) {
                boolean real = Boolean.TRUE.equals(b.get("usingRealAI"));
                String msg = b.get("message") != null ? String.valueOf(b.get("message")) : null;
                String model = b.get("model") != null ? String.valueOf(b.get("model")) : null;
                long tok = b.get("tokensUsed") instanceof Number n ? n.longValue() : 0L;
                return new AiReply(real, msg, model, tok);
            }
        } catch (Exception e) {
            log.warn("AI gateway chat call failed: {}", e.getMessage());
        }
        return new AiReply(false, null, null, 0L);
    }
}
