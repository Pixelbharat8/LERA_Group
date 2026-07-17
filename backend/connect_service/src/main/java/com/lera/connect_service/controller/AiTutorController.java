package com.lera.connect_service.controller;

import com.lera.connect_service.entity.AiTutorSession;
import com.lera.connect_service.repository.AiTutorSessionRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.AcademyStudentAccessClient;
import com.lera.connect_service.service.AiGatewayClient;
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
    private final com.lera.connect_service.service.AiGatewayClient aiGatewayClient;

    /** Org-wide list of all AI-tutor sessions (admin overview). Newest first. */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    public ResponseEntity<List<AiTutorSession>> listAll() {
        return ResponseEntity.ok(sessionRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")));
    }

    @PostMapping("/ask")
    public ResponseEntity<?> askAiTutor(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            UUID studentId = ConnectSecurity.parseUuid((String) request.get("studentId"), "studentId");
            academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);

            String question = (String) request.get("question");
            String subject = (String) request.getOrDefault("subject", "General");
            String sessionType = (String) request.getOrDefault("sessionType", "HELP");

            // Get a REAL answer from the AI Gateway, forwarding the caller's token. When no AI
            // provider is configured the gateway reports usingRealAI=false; in that case we respond
            // honestly instead of fabricating a tutoring answer and mislabelling it as "gpt-4".
            String systemPrompt = "You are a patient, encouraging tutor for " + subject
                    + ". Explain step by step at a level appropriate for a student.";
            AiGatewayClient.AiReply reply = aiGatewayClient.chat(
                    httpRequest.getHeader("Authorization"), question, systemPrompt);

            String aiResponse;
            String modelUsed;
            int tokensUsed;
            if (reply.usingRealAI() && reply.message() != null && !reply.message().isBlank()) {
                aiResponse = reply.message();
                modelUsed = reply.model();
                tokensUsed = (int) reply.tokensUsed();
            } else {
                aiResponse = "The AI tutor isn't available yet. An administrator needs to configure "
                        + "an AI provider key in Super Admin → AI Gateway before live tutoring works.";
                modelUsed = null; // honest: no real model answered
                tokensUsed = 0;
            }

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
                    .tokensUsed(tokensUsed)
                    .modelUsed(modelUsed)
                    .parentVisible(true)
                    .teacherVisible(true)
                    .isCompleted(reply.usingRealAI())
                    .completedAt(LocalDateTime.now())
                    .build();

            session = sessionRepository.save(session);
            return ResponseEntity.ok(Map.of(
                    "session", session,
                    "response", aiResponse,
                    "usingRealAI", reply.usingRealAI(),
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

        // Real practice-question generation runs through the AI Gateway once a provider key is
        // configured. Until then return an honest empty set rather than fabricated "Sample question N".
        return ResponseEntity.ok(Map.of(
                "subject", subject != null ? subject : "",
                "topic", topic != null ? topic : "",
                "difficulty", difficulty,
                "questions", List.of(),
                "note", "AI practice generation requires an AI provider key (Super Admin → AI Gateway)."));
    }
}
