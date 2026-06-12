package com.lera.connect_service.controller;

import com.lera.connect_service.entity.AiTutorSession;
import com.lera.connect_service.repository.AiTutorSessionRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.AcademyStudentAccessClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/chat/ai-tutor")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AiTutorController {

    private final AiTutorSessionRepository sessionRepository;
    private final AcademyStudentAccessClient academyStudentAccess;

    @PostMapping("/ask")
    public ResponseEntity<?> askAiTutor(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID studentId = ConnectSecurity.parseUuid((String) request.get("studentId"), "studentId");
            academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);

            String question = (String) request.get("question");
            String subject = (String) request.getOrDefault("subject", "General");
            String sessionType = (String) request.getOrDefault("sessionType", "HELP");
            String aiResponse = generateAiResponse(question, subject, sessionType);

            AiTutorSession session = AiTutorSession.builder()
                    .studentId(studentId)
                    .conversationId(request.get("conversationId") != null
                            ? ConnectSecurity.parseUuid((String) request.get("conversationId"), "conversationId")
                            : null)
                    .academyId(request.get("academyId") != null
                            ? ConnectSecurity.parseUuid((String) request.get("academyId"), "academyId")
                            : null)
                    .subject(subject)
                    .topic((String) request.get("topic"))
                    .gradeLevel((String) request.get("gradeLevel"))
                    .sessionType(sessionType)
                    .difficultyLevel((String) request.getOrDefault("difficultyLevel", "MEDIUM"))
                    .question(question)
                    .aiResponse(aiResponse)
                    .learningObjective((String) request.get("learningObjective"))
                    .tokensUsed(estimateTokens(question + aiResponse))
                    .modelUsed("gpt-4")
                    .parentVisible(true)
                    .teacherVisible(true)
                    .isCompleted(true)
                    .completedAt(LocalDateTime.now())
                    .build();

            session = sessionRepository.save(session);
            return ResponseEntity.ok(Map.of(
                    "session", session,
                    "response", aiResponse,
                    "tokensUsed", session.getTokensUsed()));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    @GetMapping("/student/{studentId}/history")
    public ResponseEntity<?> getStudentHistory(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        return ResponseEntity.ok(sessionRepository.findRecentByStudent(studentId));
    }

    @GetMapping("/student/{studentId}/subject/{subject}")
    public ResponseEntity<?> getBySubject(
            @PathVariable UUID studentId,
            @PathVariable String subject,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        return ResponseEntity.ok(sessionRepository.findByStudentAndSubject(studentId, subject));
    }

    @GetMapping("/parent/{studentId}/visible")
    public ResponseEntity<?> getParentVisible(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        return ResponseEntity.ok(sessionRepository.findVisibleToParent(studentId));
    }

    @GetMapping("/student/{studentId}/analytics")
    public ResponseEntity<?> getStudentAnalytics(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        List<Object[]> subjectUsage = sessionRepository.getSubjectUsageByStudent(studentId);
        Long totalTokens = sessionRepository.getTotalTokensUsedByStudent(studentId);

        List<Map<String, Object>> subjects = new ArrayList<>();
        for (Object[] row : subjectUsage) {
            subjects.add(Map.of("subject", row[0], "sessionCount", row[1]));
        }
        return ResponseEntity.ok(Map.of(
                "subjectUsage", subjects,
                "totalTokensUsed", totalTokens != null ? totalTokens : 0));
    }

    @PutMapping("/{sessionId}/feedback")
    public ResponseEntity<?> rateFeedback(
            @PathVariable UUID sessionId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        return sessionRepository.findById(sessionId)
                .map(session -> {
                    academyStudentAccess.assertCanAccessStudentEntity(authUser, session.getStudentId());
                    session.setFeedbackRating(((Number) request.get("rating")).intValue());
                    session.setFeedbackText((String) request.get("feedback"));
                    return ResponseEntity.ok(sessionRepository.save(session));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/practice")
    public ResponseEntity<?> startPractice(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isAcademyStaff(authUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Staff role required");
        }
        String subject = (String) request.get("subject");
        String topic = (String) request.get("topic");
        String difficulty = (String) request.getOrDefault("difficulty", "MEDIUM");
        int questionCount = request.get("questionCount") != null
                ? ((Number) request.get("questionCount")).intValue()
                : 5;

        List<Map<String, Object>> questions = generatePracticeQuestions(subject, topic, difficulty, questionCount);
        return ResponseEntity.ok(Map.of(
                "subject", subject,
                "topic", topic,
                "difficulty", difficulty,
                "questions", questions));
    }

    private String generateAiResponse(String question, String subject, String sessionType) {
        return "I'd be happy to help you with your " + subject + " question! "
                + "Here's an explanation:\n\n"
                + "Based on your question about \"" + question + "\", let me break this down step by step...\n\n"
                + "1. First, let's understand the concept...\n"
                + "2. Here's how to approach this...\n"
                + "3. The answer is...\n\n"
                + "Would you like me to explain any part in more detail?";
    }

    private int estimateTokens(String text) {
        return text.length() / 4;
    }

    private List<Map<String, Object>> generatePracticeQuestions(
            String subject, String topic, String difficulty, int count) {
        List<Map<String, Object>> questions = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            questions.add(Map.of(
                    "id", i,
                    "type", "multiple_choice",
                    "question", "Sample " + subject + " question " + i + " about " + topic,
                    "options", List.of("Option A", "Option B", "Option C", "Option D"),
                    "correctAnswer", 0,
                    "explanation", "This is the explanation for question " + i));
        }
        return questions;
    }
}
