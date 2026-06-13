package com.lera.connect_service.controller;

import com.lera.connect_service.entity.AssignmentSubmission;
import com.lera.connect_service.entity.SharedAssignment;
import com.lera.connect_service.repository.AssignmentSubmissionRepository;
import com.lera.connect_service.repository.SharedAssignmentRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ChatAuthorizationService;
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
@RequestMapping("/api/chat/assignments")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AssignmentController {

    private final SharedAssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final ChatAuthorizationService chatAuth;
    private final AcademyStudentAccessClient academyStudentAccess;

    @PostMapping
    public ResponseEntity<?> shareAssignment(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            String conversationId = (String) request.get("conversationId");
            chatAuth.requireParticipantConversation(authUser, conversationId);
            UUID sharedById = ConnectSecurity.requireUserId(authUser);
            ConnectSecurity.assertActorIsSelf(authUser, (String) request.get("sharedById"));

            SharedAssignment assignment = SharedAssignment.builder()
                    .conversationId(ConnectSecurity.parseUuid(conversationId, "conversationId"))
                    .classId(request.get("classId") != null
                            ? ConnectSecurity.parseUuid((String) request.get("classId"), "classId")
                            : null)
                    .sharedById(sharedById)
                    .assignmentType((String) request.getOrDefault("assignmentType", "HOMEWORK"))
                    .title((String) request.get("title"))
                    .description((String) request.get("description"))
                    .subject((String) request.get("subject"))
                    .dueDate(request.get("dueDate") != null
                            ? LocalDateTime.parse((String) request.get("dueDate"))
                            : null)
                    .maxScore(request.get("maxScore") != null ? ((Number) request.get("maxScore")).intValue() : null)
                    .attachmentUrls((String) request.get("attachmentUrls"))
                    .instructions((String) request.get("instructions"))
                    .allowLateSubmission((Boolean) request.getOrDefault("allowLateSubmission", false))
                    .latePenaltyPercent(request.get("latePenaltyPercent") != null
                            ? ((Number) request.get("latePenaltyPercent")).intValue()
                            : null)
                    .isPublished(true)
                    .notifyParents((Boolean) request.getOrDefault("notifyParents", true))
                    .build();

            assignment = assignmentRepository.save(assignment);
            return ResponseEntity.ok(Map.of(
                    "assignment", assignment,
                    "message", "Assignment shared successfully"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<?> getByConversation(
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal AuthUser authUser) {
        chatAuth.requireParticipantConversation(authUser, conversationId.toString());
        return ResponseEntity.ok(assignmentRepository.findPublishedByConversation(conversationId));
    }

    @GetMapping("/class/{classId}/upcoming")
    public ResponseEntity<?> getUpcoming(
            @PathVariable UUID classId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isAcademyStaff(authUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Staff role required");
        }
        return ResponseEntity.ok(assignmentRepository.findUpcomingByClass(classId, LocalDateTime.now()));
    }

    @PostMapping("/{assignmentId}/submit")
    public ResponseEntity<?> submitAssignment(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            SharedAssignment assignment = assignmentRepository.findById(assignmentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
            chatAuth.requireParticipantConversation(authUser, assignment.getConversationId().toString());

            UUID studentId = ConnectSecurity.parseUuid((String) request.get("studentId"), "studentId");
            academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);

            Optional<AssignmentSubmission> existing =
                    submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId);

            if (existing.isPresent()) {
                AssignmentSubmission submission = existing.get();
                submission.setSubmissionText((String) request.get("submissionText"));
                submission.setAttachmentUrls((String) request.get("attachmentUrls"));
                submission.setUpdatedAt(LocalDateTime.now());
                return ResponseEntity.ok(submissionRepository.save(submission));
            }

            boolean isLate = assignment.getDueDate() != null
                    && LocalDateTime.now().isAfter(assignment.getDueDate());

            AssignmentSubmission submission = AssignmentSubmission.builder()
                    .assignmentId(assignmentId)
                    .studentId(studentId)
                    .submissionText((String) request.get("submissionText"))
                    .attachmentUrls((String) request.get("attachmentUrls"))
                    .status("SUBMITTED")
                    .isLate(isLate)
                    .build();

            submission = submissionRepository.save(submission);
            return ResponseEntity.ok(Map.of(
                    "submission", submission,
                    "isLate", isLate,
                    "message", "Assignment submitted successfully"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    @PutMapping("/submissions/{submissionId}/grade")
    public ResponseEntity<?> gradeSubmission(
            @PathVariable UUID submissionId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isAcademyStaff(authUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Staff role required to grade");
        }
        ConnectSecurity.assertActorIsSelf(authUser, (String) request.get("gradedById"));
        UUID gradedById = ConnectSecurity.requireUserId(authUser);

        return submissionRepository.findById(submissionId)
                .map(submission -> {
                    SharedAssignment assignment = assignmentRepository.findById(submission.getAssignmentId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
                    chatAuth.requireParticipantConversation(authUser, assignment.getConversationId().toString());

                    submission.setScore(((Number) request.get("score")).intValue());
                    submission.setGrade((String) request.get("grade"));
                    submission.setFeedback((String) request.get("feedback"));
                    submission.setGradedById(gradedById);
                    submission.setGradedAt(LocalDateTime.now());
                    submission.setStatus("GRADED");
                    submission.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(submissionRepository.save(submission));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{assignmentId}/submissions")
    public ResponseEntity<?> getSubmissions(
            @PathVariable UUID assignmentId,
            @AuthenticationPrincipal AuthUser authUser) {
        SharedAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        chatAuth.requireParticipantConversation(authUser, assignment.getConversationId().toString());

        List<AssignmentSubmission> submissions = submissionRepository.findByAssignmentId(assignmentId);
        long total = submissionRepository.countByAssignment(assignmentId);
        long graded = submissionRepository.countGradedByAssignment(assignmentId);

        return ResponseEntity.ok(Map.of(
                "submissions", submissions,
                "totalSubmissions", total,
                "gradedCount", graded,
                "pendingGrading", total - graded));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentSubmissions(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        return ResponseEntity.ok(submissionRepository.findByStudentId(studentId));
    }
}
