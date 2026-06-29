package com.lera.ai_gateway.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OpenAIServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private AiConfigService aiConfig;

    @InjectMocks
    private OpenAIService openAIService;

    /**
     * OpenAIService resolves provider/key/model from AiConfigService at call time, so the tests
     * drive behaviour by stubbing the resolved settings: a real key = configured (calls the API),
     * an empty key = not configured (returns the local fallback).
     */
    private void aiSettings(boolean configured) {
        when(aiConfig.resolve()).thenReturn(new AiConfigService.AiSettings(
                "openai",
                configured ? "test-key" : "",
                "gpt-4o-mini",
                "https://api.openai.com/v1/chat/completions",
                null));
    }

    @Test
    void isConfigured_shouldReturnTrue_whenKeySet() {
        aiSettings(true);
        assertTrue(openAIService.isConfigured());
    }

    @Test
    void isConfigured_shouldReturnFalse_whenKeyEmpty() {
        aiSettings(false);
        assertFalse(openAIService.isConfigured());
    }

    @Test
    void chat_shouldReturnFallback_whenNotConfigured() {
        aiSettings(false);
        Map<String, Object> result = openAIService.chat("Hello", null, null);
        assertFalse((Boolean) result.get("success"));
        assertNotNull(result.get("message"));
        assertTrue(result.get("error").toString().contains("not configured"));
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void chat_shouldReturnSuccess_whenApiResponds() {
        aiSettings(true);
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("choices", List.of(
                Map.of("message", Map.of("content", "Hello! I can help you."))
        ));
        responseBody.put("usage", Map.of("total_tokens", 50, "prompt_tokens", 20, "completion_tokens", 30));

        ResponseEntity<Map> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(responseEntity);

        Map<String, Object> result = openAIService.chat("Explain grammar", "You are a teacher", null);
        assertTrue((Boolean) result.get("success"));
        assertEquals("Hello! I can help you.", result.get("message"));
        assertEquals(50, result.get("tokensUsed"));
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void chat_shouldReturnFallback_whenApiThrows() {
        aiSettings(true);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new RuntimeException("Connection refused"));

        Map<String, Object> result = openAIService.chat("Hello", null, null);
        assertFalse((Boolean) result.get("success"));
        assertNotNull(result.get("message")); // fallback response
    }

    @Test
    void generateEducationalContent_shouldCallChat() {
        aiSettings(false);
        Map<String, Object> result = openAIService.generateEducationalContent("Present Tense", "English", "Beginner");
        assertFalse((Boolean) result.get("success"));
        assertNotNull(result.get("message"));
    }

    @Test
    void generateQuizQuestions_shouldCallChat() {
        aiSettings(false);
        Map<String, Object> result = openAIService.generateQuizQuestions("Vocabulary", "English", 5, "EASY");
        assertFalse((Boolean) result.get("success"));
        assertNotNull(result.get("message"));
    }

    @Test
    void assessAnswer_shouldCallChat() {
        aiSettings(false);
        Map<String, Object> result = openAIService.assessAnswer(
                "What is present simple?", "It is for habits", "Used for habits and facts", "English");
        assertFalse((Boolean) result.get("success"));
        assertNotNull(result.get("message"));
    }

    @Test
    void generateLearningPath_shouldCallChat() {
        aiSettings(false);
        Map<String, Object> result = openAIService.generateLearningPath(
                "English", "Beginner", List.of("Speaking", "Listening"), "Pass IELTS 6.5");
        assertFalse((Boolean) result.get("success"));
        assertNotNull(result.get("message"));
    }

    @Test
    void fallbackResponse_shouldMatchGrammarPattern() {
        aiSettings(false);
        Map<String, Object> result = openAIService.chat(
                "Explain present simple and present continuous tenses", null, null);
        String msg = result.get("message").toString();
        assertTrue(msg.contains("Present Simple") || msg.contains("grammar") || msg.contains("question"));
    }
}
