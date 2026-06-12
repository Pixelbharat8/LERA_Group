package com.lera.ai_gateway.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OpenAIServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private OpenAIService openAIService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(openAIService, "openaiApiKey", "test-key");
        ReflectionTestUtils.setField(openAIService, "openaiApiUrl", "https://api.openai.com/v1/chat/completions");
        ReflectionTestUtils.setField(openAIService, "defaultModel", "gpt-4o-mini");
        ReflectionTestUtils.setField(openAIService, "maxTokens", 2000);
        ReflectionTestUtils.setField(openAIService, "temperature", 0.7);
    }

    @Test
    void isConfigured_shouldReturnTrue_whenKeySet() {
        assertTrue(openAIService.isConfigured());
    }

    @Test
    void isConfigured_shouldReturnFalse_whenKeyEmpty() {
        ReflectionTestUtils.setField(openAIService, "openaiApiKey", "");
        assertFalse(openAIService.isConfigured());
    }

    @Test
    void chat_shouldReturnFallback_whenNotConfigured() {
        ReflectionTestUtils.setField(openAIService, "openaiApiKey", "");
        Map<String, Object> result = openAIService.chat("Hello", null, null);
        assertFalse((Boolean) result.get("success"));
        assertNotNull(result.get("message"));
        assertTrue(result.get("error").toString().contains("not configured"));
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void chat_shouldReturnSuccess_whenApiResponds() {
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
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new RuntimeException("Connection refused"));

        Map<String, Object> result = openAIService.chat("Hello", null, null);
        assertFalse((Boolean) result.get("success"));
        assertNotNull(result.get("message")); // fallback response
    }

    @Test
    void generateEducationalContent_shouldCallChat() {
        // Will use fallback since RestTemplate mock isn't configured for this specific call
        ReflectionTestUtils.setField(openAIService, "openaiApiKey", "");
        Map<String, Object> result = openAIService.generateEducationalContent("Present Tense", "English", "Beginner");
        assertFalse((Boolean) result.get("success"));
        assertNotNull(result.get("message"));
    }

    @Test
    void generateQuizQuestions_shouldCallChat() {
        ReflectionTestUtils.setField(openAIService, "openaiApiKey", "");
        Map<String, Object> result = openAIService.generateQuizQuestions("Vocabulary", "English", 5, "EASY");
        assertFalse((Boolean) result.get("success"));
        assertNotNull(result.get("message"));
    }

    @Test
    void assessAnswer_shouldCallChat() {
        ReflectionTestUtils.setField(openAIService, "openaiApiKey", "");
        Map<String, Object> result = openAIService.assessAnswer(
                "What is present simple?", "It is for habits", "Used for habits and facts", "English");
        assertFalse((Boolean) result.get("success"));
        assertNotNull(result.get("message"));
    }

    @Test
    void generateLearningPath_shouldCallChat() {
        ReflectionTestUtils.setField(openAIService, "openaiApiKey", "");
        Map<String, Object> result = openAIService.generateLearningPath(
                "English", "Beginner", List.of("Speaking", "Listening"), "Pass IELTS 6.5");
        assertFalse((Boolean) result.get("success"));
        assertNotNull(result.get("message"));
    }

    @Test
    void fallbackResponse_shouldMatchGrammarPattern() {
        ReflectionTestUtils.setField(openAIService, "openaiApiKey", "");
        Map<String, Object> result = openAIService.chat(
                "Explain present simple and present continuous tenses", null, null);
        String msg = result.get("message").toString();
        assertTrue(msg.contains("Present Simple") || msg.contains("grammar") || msg.contains("question"));
    }
}
