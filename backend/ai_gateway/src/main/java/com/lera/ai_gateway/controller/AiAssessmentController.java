package com.lera.ai_gateway.controller;

import com.lera.ai_gateway.entity.AiAssessment;
import com.lera.ai_gateway.repository.AiAssessmentRepository;
import com.lera.ai_gateway.security.AuthUser;
import com.lera.ai_gateway.service.AcademyStudentAccessClient;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai/assessments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER','TEACHER','TA','TEACHING_ASSISTANT')")
public class AiAssessmentController {

    private final AiAssessmentRepository aiAssessmentRepository;
    private final AcademyStudentAccessClient academyStudentAccess;

    @GetMapping
    public ResponseEntity<List<AiAssessment>> getAllAssessments(
            @RequestParam(required = false) UUID studentId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        if (studentId != null) {
            academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
            return ResponseEntity.ok(aiAssessmentRepository.findByStudentId(studentId));
        }
        return ResponseEntity.ok(aiAssessmentRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AiAssessment> getAssessmentById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiAssessmentRepository.findById(id)
                .map(row -> {
                    academyStudentAccess.assertCanAccessStudentEntity(authUser, row.getStudentId());
                    return ResponseEntity.ok(row);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AiAssessment>> getAssessmentsByStudent(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        return ResponseEntity.ok(aiAssessmentRepository.findByStudentId(studentId));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<AiAssessment>> getAssessmentsByType(@PathVariable String type) {
        return ResponseEntity.ok(aiAssessmentRepository.findByAssessmentType(type));
    }

    @GetMapping("/subject/{subject}")
    public ResponseEntity<List<AiAssessment>> getAssessmentsBySubject(@PathVariable String subject) {
        return ResponseEntity.ok(aiAssessmentRepository.findBySubject(subject));
    }

    @GetMapping("/student/{studentId}/subject/{subject}")
    public ResponseEntity<List<AiAssessment>> getAssessmentsByStudentAndSubject(
            @PathVariable UUID studentId,
            @PathVariable String subject,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        return ResponseEntity.ok(aiAssessmentRepository.findByStudentIdAndSubject(studentId, subject));
    }

    @PostMapping
    public ResponseEntity<AiAssessment> createAssessment(
            @Valid @RequestBody AiAssessment assessment,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, assessment.getStudentId());
        return ResponseEntity.ok(aiAssessmentRepository.save(assessment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AiAssessment> updateAssessment(
            @PathVariable UUID id,
            @Valid @RequestBody AiAssessment assessmentDetails,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiAssessmentRepository.findById(id).map(assessment -> {
            academyStudentAccess.assertCanAccessStudentEntity(authUser, assessment.getStudentId());
            if (assessmentDetails.getSubject() != null) {
                assessment.setSubject(assessmentDetails.getSubject());
            }
            if (assessmentDetails.getTopic() != null) {
                assessment.setTopic(assessmentDetails.getTopic());
            }
            if (assessmentDetails.getDifficultyLevel() != null) {
                assessment.setDifficultyLevel(assessmentDetails.getDifficultyLevel());
            }
            if (assessmentDetails.getTotalQuestions() != null) {
                assessment.setTotalQuestions(assessmentDetails.getTotalQuestions());
            }
            if (assessmentDetails.getQuestionsAttempted() != null) {
                assessment.setQuestionsAttempted(assessmentDetails.getQuestionsAttempted());
            }
            return ResponseEntity.ok(aiAssessmentRepository.save(assessment));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssessment(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiAssessmentRepository.findById(id)
                .map(row -> {
                    academyStudentAccess.assertCanAccessStudentEntity(authUser, row.getStudentId());
                    aiAssessmentRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
