package com.lera.ai_gateway.controller;

import com.lera.ai_gateway.security.AiGatewaySecurity;
import com.lera.ai_gateway.security.AuthUser;
import com.lera.ai_gateway.service.AcademyStudentAccessClient;
import com.lera.ai_gateway.service.OpenAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class AiController {

    private final OpenAIService openAIService;
    private final AcademyStudentAccessClient academyStudentAccess;

    // Health check
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "AI Gateway",
            "timestamp", LocalDateTime.now().toString(),
            "models", Arrays.asList("GPT-4", "GPT-4-Turbo", "GPT-4o-mini", "Claude-3", "Gemini-Pro"),
            "openaiConfigured", openAIService.isConfigured()
        ));
    }

    // Stats endpoint for SuperAdmin dashboard
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertOrgWide(authUser);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRequests", 1250); // In production, track actual usage
        stats.put("totalTokens", 125000);
        stats.put("averageResponseTime", 1.2); // seconds
        stats.put("activeModels", Arrays.asList("gpt-4o-mini", "gpt-4"));
        stats.put("errorRate", 0.02);
        stats.put("uptime", "99.9%");
        stats.put("todayRequests", 150);
        stats.put("todayTokens", 15000);
        stats.put("modelUsage", Map.of(
            "gpt-4o-mini", 800,
            "gpt-4", 350,
            "gpt-4-turbo", 100
        ));
        stats.put("subjectBreakdown", Map.of(
            "English Grammar", 400,
            "English Vocabulary", 300,
            "English Conversation", 250,
            "English Writing", 200,
            "General Questions", 100
        ));
        stats.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(stats);
    }

    // Chat with AI - uses real OpenAI API if configured, otherwise fallback
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@Valid @RequestBody Map<String, Object> request) {
        try {
            String message = (String) request.get("message");
            String subject = (String) request.getOrDefault("subject", "English");
            String model = (String) request.getOrDefault("model", "gpt-4o-mini");
            String systemPrompt = (String) request.getOrDefault("systemPrompt", 
                "You are an expert " + subject + " tutor helping students learn. Be clear, helpful, and encouraging.");
            
            // Use OpenAI service (real API or fallback)
            Map<String, Object> result = openAIService.chat(message, systemPrompt, model);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", result.get("message"));
            response.put("model", model);
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("tokensUsed", result.getOrDefault("tokensUsed", 0));
            response.put("usingRealAI", result.getOrDefault("success", false));
            
            if (result.containsKey("error")) {
                response.put("note", result.get("error"));
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // AI Tutoring endpoint
    @PostMapping("/tutor")
    public ResponseEntity<?> tutor(@Valid @RequestBody Map<String, Object> request) {
        try {
            String question = (String) request.get("question");
            String subject = (String) request.getOrDefault("subject", "English");
            String level = (String) request.getOrDefault("level", "intermediate");
            
            // Use OpenAI for tutoring
            Map<String, Object> result = openAIService.generateEducationalContent(question, subject, level);
            
            return ResponseEntity.ok(Map.of(
                "response", result.get("message"),
                "subject", subject,
                "level", level,
                "hints", generateHints(question, subject),
                "relatedTopics", getRelatedTopics(subject),
                "nextSteps", Arrays.asList("Practice with exercises", "Review related topics", "Take a quiz")
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // AI Assessment endpoint
    @PostMapping("/assess")
    public ResponseEntity<?> assess(@Valid @RequestBody Map<String, Object> request) {
        try {
            String answer = (String) request.get("answer");
            String correctAnswer = (String) request.get("correctAnswer");
            String subject = (String) request.getOrDefault("subject", "English");
            
            double score = calculateAnswerScore(answer, correctAnswer);
            String feedback = generateFeedback(answer, correctAnswer, score);
            
            return ResponseEntity.ok(Map.of(
                "score", score,
                "percentage", Math.round(score * 100) + "%",
                "feedback", feedback,
                "isCorrect", score >= 0.8,
                "suggestions", generateImprovementSuggestions(answer, subject),
                "detailedAnalysis", Map.of(
                    "accuracy", score > 0.8 ? "High" : score > 0.5 ? "Medium" : "Low",
                    "completeness", score > 0.7 ? "Complete" : "Partial",
                    "clarity", "Good"
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // AI Learning Path generator
    @PostMapping("/learning-path")
    public ResponseEntity<?> generateLearningPath(@Valid @RequestBody Map<String, Object> request) {
        try {
            String subject = (String) request.getOrDefault("subject", "English");
            String currentLevel = (String) request.getOrDefault("currentLevel", "beginner");
            String targetLevel = (String) request.getOrDefault("targetLevel", "advanced");
            
            List<Map<String, Object>> path = createLearningPath(subject, currentLevel, targetLevel);
            
            return ResponseEntity.ok(Map.of(
                "subject", subject,
                "currentLevel", currentLevel,
                "targetLevel", targetLevel,
                "estimatedDuration", "12 weeks",
                "totalHours", 60,
                "path", path
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // AI Recommendations endpoint
    @GetMapping("/recommendations")
    public ResponseEntity<?> getRecommendations(
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String subject,
            @AuthenticationPrincipal AuthUser authUser) {
        if (studentId != null && !studentId.isBlank()) {
            academyStudentAccess.assertCanAccessStudentEntity(
                    authUser, java.util.UUID.fromString(studentId.trim()));
        } else {
            AiGatewaySecurity.assertStaff(authUser);
        }

        List<Map<String, Object>> recommendations = new ArrayList<>();
        
        recommendations.add(Map.of(
            "id", UUID.randomUUID().toString(),
            "type", "COURSE",
            "title", "Advanced Grammar Course",
            "description", "Based on your performance, we recommend strengthening grammar skills",
            "priority", "HIGH",
            "confidence", 0.92
        ));
        
        recommendations.add(Map.of(
            "id", UUID.randomUUID().toString(),
            "type", "PRACTICE",
            "title", "Vocabulary Practice Session",
            "description", "Daily vocabulary practice will help expand your word bank",
            "priority", "MEDIUM",
            "confidence", 0.85
        ));
        
        recommendations.add(Map.of(
            "id", UUID.randomUUID().toString(),
            "type", "ASSESSMENT",
            "title", "Progress Assessment",
            "description", "Time for a progress check to track your improvement",
            "priority", "LOW",
            "confidence", 0.78
        ));
        
        return ResponseEntity.ok(recommendations);
    }

    // Generate practice questions
    @PostMapping("/generate-questions")
    public ResponseEntity<?> generateQuestions(@Valid @RequestBody Map<String, Object> request) {
        try {
            String topic = (String) request.getOrDefault("topic", "General English");
            String level = (String) request.getOrDefault("level", "intermediate");
            int count = (int) request.getOrDefault("count", 5);
            
            List<Map<String, Object>> questions = generatePracticeQuestions(topic, level, count);
            
            return ResponseEntity.ok(Map.of(
                "topic", topic,
                "level", level,
                "totalQuestions", questions.size(),
                "questions", questions
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Helper methods for AI response generation

    private List<String> generateHints(String question, String subject) {
        return Arrays.asList(
            "💡 Think about the context in which this is used",
            "💡 Consider similar examples you've seen before",
            "💡 Break down the problem into smaller parts",
            "💡 Try to relate it to something you already know"
        );
    }

    private List<String> getRelatedTopics(String subject) {
        if ("English".equalsIgnoreCase(subject)) {
            return Arrays.asList("Grammar Basics", "Vocabulary Building", "Pronunciation", "Reading Skills", "Writing Practice");
        }
        return Arrays.asList("Fundamentals", "Intermediate Practice", "Advanced Topics", "Real-world Applications");
    }

    private double calculateAnswerScore(String answer, String correctAnswer) {
        if (answer == null || correctAnswer == null) return 0.0;
        if (answer.equalsIgnoreCase(correctAnswer)) return 1.0;
        
        String[] answerWords = answer.toLowerCase().split("\\s+");
        String[] correctWords = correctAnswer.toLowerCase().split("\\s+");
        
        int matches = 0;
        for (String word : answerWords) {
            for (String correct : correctWords) {
                if (word.equals(correct)) matches++;
            }
        }
        
        return Math.min(1.0, (double) matches / correctWords.length);
    }

    private String generateFeedback(String answer, String correctAnswer, double score) {
        if (score >= 0.9) return "🎉 Excellent! Your answer is correct and well-formulated.";
        if (score >= 0.7) return "👍 Good effort! You're on the right track. Consider refining your answer slightly.";
        if (score >= 0.5) return "📚 Partial credit. You have some correct elements, but review the key concepts.";
        return "💪 Keep practicing! Review the material and try again.";
    }

    private List<String> generateImprovementSuggestions(String answer, String subject) {
        return Arrays.asList(
            "Practice more examples of this type",
            "Review the fundamental concepts",
            "Try explaining your reasoning step by step",
            "Create flashcards for key terms"
        );
    }

    private List<Map<String, Object>> createLearningPath(String subject, String currentLevel, String targetLevel) {
        List<Map<String, Object>> path = new ArrayList<>();
        
        path.add(Map.of(
            "step", 1,
            "title", "Foundation Review",
            "duration", "2 weeks",
            "hours", 10,
            "topics", Arrays.asList("Basic concepts", "Key vocabulary", "Simple exercises"),
            "status", "not_started"
        ));
        
        path.add(Map.of(
            "step", 2,
            "title", "Intermediate Skills",
            "duration", "4 weeks",
            "hours", 20,
            "topics", Arrays.asList("Complex grammar", "Reading comprehension", "Writing practice"),
            "status", "not_started"
        ));
        
        path.add(Map.of(
            "step", 3,
            "title", "Advanced Application",
            "duration", "4 weeks",
            "hours", 20,
            "topics", Arrays.asList("Real-world usage", "Exam preparation", "Fluency practice"),
            "status", "not_started"
        ));
        
        path.add(Map.of(
            "step", 4,
            "title", "Mastery & Certification",
            "duration", "2 weeks",
            "hours", 10,
            "topics", Arrays.asList("Mock exams", "Final assessment", "Certification test"),
            "status", "not_started"
        ));
        
        return path;
    }

    private List<Map<String, Object>> generatePracticeQuestions(String topic, String level, int count) {
        List<Map<String, Object>> questions = new ArrayList<>();
        
        String[] sampleQuestions = {
            "Fill in the blank: She ___ to the store yesterday. (go)",
            "Choose the correct article: ___ apple a day keeps the doctor away.",
            "Identify the tense: 'I have been studying for three hours.'",
            "Select the correct preposition: The book is ___ the table.",
            "Correct the sentence: He don't like ice cream."
        };
        
        String[] answers = {"went", "An", "Present Perfect Continuous", "on", "He doesn't like ice cream."};
        
        for (int i = 0; i < Math.min(count, sampleQuestions.length); i++) {
            questions.add(Map.of(
                "id", i + 1,
                "question", sampleQuestions[i],
                "type", "fill_blank",
                "difficulty", level,
                "correctAnswer", answers[i],
                "points", 10
            ));
        }
        
        return questions;
    }
}
