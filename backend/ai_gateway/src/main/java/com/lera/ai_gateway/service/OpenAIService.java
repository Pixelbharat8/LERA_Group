package com.lera.ai_gateway.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OpenAIService {

    @Value("${openai.api.key:}")
    private String openaiApiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String openaiApiUrl;

    @Value("${openai.model:gpt-4o-mini}")
    private String defaultModel;

    @Value("${openai.max-tokens:2000}")
    private int maxTokens;

    @Value("${openai.temperature:0.7}")
    private double temperature;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Check if OpenAI API is configured
     */
    public boolean isConfigured() {
        return openaiApiKey != null && !openaiApiKey.isEmpty();
    }

    /**
     * Send a chat message to OpenAI
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Map<String, Object> chat(String message, String systemPrompt, String model) {
        if (!isConfigured()) {
            return Map.of(
                "success", false,
                "error", "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.",
                "message", generateFallbackResponse(message, systemPrompt)
            );
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openaiApiKey);

            List<Map<String, String>> messages = new ArrayList<>();
            
            // Add system prompt if provided
            if (systemPrompt != null && !systemPrompt.isEmpty()) {
                messages.add(Map.of("role", "system", "content", systemPrompt));
            }
            
            // Add user message
            messages.add(Map.of("role", "user", "content", message));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model != null ? model : defaultModel);
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("temperature", temperature);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                openaiApiUrl,
                HttpMethod.POST,
                entity,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, String> messageContent = (Map<String, String>) choice.get("message");
                    
                    Map<String, Object> usage = (Map<String, Object>) responseBody.get("usage");
                    
                    return Map.of(
                        "success", true,
                        "message", messageContent.get("content"),
                        "model", model != null ? model : defaultModel,
                        "tokensUsed", usage != null ? usage.get("total_tokens") : 0,
                        "promptTokens", usage != null ? usage.get("prompt_tokens") : 0,
                        "completionTokens", usage != null ? usage.get("completion_tokens") : 0
                    );
                }
            }
            
            return Map.of(
                "success", false,
                "error", "Empty response from OpenAI",
                "message", generateFallbackResponse(message, systemPrompt)
            );

        } catch (Exception e) {
            return Map.of(
                "success", false,
                "error", e.getMessage(),
                "message", generateFallbackResponse(message, systemPrompt)
            );
        }
    }

    /**
     * Generate educational content with AI
     */
    public Map<String, Object> generateEducationalContent(String topic, String subject, String level) {
        String systemPrompt = String.format(
            "You are an expert %s teacher helping students at the %s level. " +
            "Provide clear, educational explanations with examples. " +
            "Use Vietnamese translations where helpful for Vietnamese learners.",
            subject, level
        );
        
        String userPrompt = String.format(
            "Please explain the following topic in detail: %s\n\n" +
            "Include:\n" +
            "1. A clear explanation\n" +
            "2. 2-3 practical examples\n" +
            "3. Common mistakes to avoid\n" +
            "4. Practice tips",
            topic
        );
        
        return chat(userPrompt, systemPrompt, null);
    }

    /**
     * Generate quiz questions with AI
     */
    public Map<String, Object> generateQuizQuestions(String topic, String subject, int count, String difficulty) {
        String systemPrompt = String.format(
            "You are an expert %s teacher creating quiz questions. " +
            "Generate multiple choice questions with 4 options each (A, B, C, D). " +
            "Return the questions in JSON format.",
            subject
        );
        
        String userPrompt = String.format(
            "Generate %d %s difficulty multiple choice questions about: %s\n\n" +
            "Format as JSON array with structure:\n" +
            "[{\"question\": \"...\", \"options\": [\"A. ...\", \"B. ...\", \"C. ...\", \"D. ...\"], \"correct\": \"A\", \"explanation\": \"...\"}]",
            count, difficulty, topic
        );
        
        return chat(userPrompt, systemPrompt, null);
    }

    /**
     * AI-powered answer assessment
     */
    public Map<String, Object> assessAnswer(String question, String studentAnswer, String correctAnswer, String subject) {
        String systemPrompt = String.format(
            "You are an expert %s teacher evaluating student answers. " +
            "Provide constructive feedback, scores, and suggestions for improvement. " +
            "Be encouraging while being accurate.",
            subject
        );
        
        String userPrompt = String.format(
            "Question: %s\n\n" +
            "Correct Answer: %s\n\n" +
            "Student's Answer: %s\n\n" +
            "Please evaluate the student's answer and provide:\n" +
            "1. Score (0-100)\n" +
            "2. What they got right\n" +
            "3. What needs improvement\n" +
            "4. Suggestions for better understanding",
            question, correctAnswer, studentAnswer
        );
        
        return chat(userPrompt, systemPrompt, null);
    }

    /**
     * Generate personalized learning path
     */
    public Map<String, Object> generateLearningPath(String subject, String currentLevel, List<String> weakAreas, String goal) {
        String systemPrompt = String.format(
            "You are an expert %s curriculum designer. " +
            "Create personalized learning paths based on student needs and goals.",
            subject
        );
        
        String userPrompt = String.format(
            "Create a personalized learning path for:\n" +
            "- Subject: %s\n" +
            "- Current Level: %s\n" +
            "- Areas to Improve: %s\n" +
            "- Goal: %s\n\n" +
            "Include:\n" +
            "1. Weekly learning objectives\n" +
            "2. Recommended resources\n" +
            "3. Practice activities\n" +
            "4. Milestones to track progress",
            subject, currentLevel, String.join(", ", weakAreas), goal
        );
        
        return chat(userPrompt, systemPrompt, null);
    }

    /**
     * Fallback response when API is not available
     */
    private String generateFallbackResponse(String message, String systemPrompt) {
        // Basic pattern matching for common educational questions
        String lowerMessage = message.toLowerCase();
        
        if (lowerMessage.contains("present simple") && lowerMessage.contains("present continuous")) {
            return "**Present Simple vs Present Continuous:**\n\n" +
                   "**Present Simple:** Used for habits, facts, and general truths.\n" +
                   "- Example: \"I study English every day.\"\n" +
                   "- Example: \"The sun rises in the east.\"\n\n" +
                   "**Present Continuous:** Used for actions happening right now.\n" +
                   "- Example: \"I am studying English now.\"\n" +
                   "- Example: \"She is reading a book at the moment.\"\n\n" +
                   "💡 **Tip:** Look for time markers like 'every day' (simple) vs 'now/at the moment' (continuous).";
        }
        
        if (lowerMessage.contains("grammar") || lowerMessage.contains("tense")) {
            return "Great question about grammar! Here are some key points:\n\n" +
                   "1. **Understand the concept first** - know when to use each form\n" +
                   "2. **Practice with examples** - make your own sentences\n" +
                   "3. **Learn time markers** - they help you choose the right tense\n\n" +
                   "Would you like me to explain a specific grammar topic in detail?";
        }
        
        if (lowerMessage.contains("vocabulary") || lowerMessage.contains("word")) {
            return "Building vocabulary is essential! Here's how:\n\n" +
                   "1. **Learn in context** - read sentences, not just word lists\n" +
                   "2. **Use spaced repetition** - review words at increasing intervals\n" +
                   "3. **Practice actively** - use new words in speaking and writing\n\n" +
                   "What specific vocabulary topic would you like help with?";
        }
        
        // Default educational response
        return String.format(
            "Thank you for your question! Let me help you understand this better.\n\n" +
            "**Your question:** %s\n\n" +
            "**Key points to consider:**\n" +
            "1. Start with the fundamentals and build understanding step by step\n" +
            "2. Practice regularly with real examples\n" +
            "3. Don't hesitate to ask for clarification\n\n" +
            "Would you like me to explain any specific aspect in more detail?",
            message.length() > 100 ? message.substring(0, 100) + "..." : message
        );
    }
}
