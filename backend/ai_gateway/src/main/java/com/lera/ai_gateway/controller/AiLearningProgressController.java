package com.lera.ai_gateway.controller;

import com.lera.ai_gateway.entity.AiLearningProgress;
import com.lera.ai_gateway.repository.AiLearningProgressRepository;
import com.lera.ai_gateway.security.AiGatewaySecurity;
import com.lera.ai_gateway.security.AuthUser;
import com.lera.ai_gateway.service.AcademyStudentAccessClient;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai-learning-progress")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AiLearningProgressController {

    private final AiLearningProgressRepository aiLearningProgressRepository;
    private final AcademyStudentAccessClient academyStudentAccess;

    @GetMapping
    public ResponseEntity<List<AiLearningProgress>> getAll(
            @RequestParam(required = false) UUID studentId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        if (studentId != null) {
            academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
            return ResponseEntity.ok(aiLearningProgressRepository.findByStudentId(studentId));
        }
        if (AiGatewaySecurity.isAcademyStaff(authUser)) {
            return ResponseEntity.ok(aiLearningProgressRepository.findAll(pageable).getContent());
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Specify studentId or use a staff role");
    }

    @GetMapping("/{id}")
    public ResponseEntity<AiLearningProgress> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiLearningProgressRepository.findById(id)
                .map(row -> {
                    academyStudentAccess.assertCanAccessStudentEntity(authUser, row.getStudentId());
                    return ResponseEntity.ok(row);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AiLearningProgress>> getByStudent(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        return ResponseEntity.ok(aiLearningProgressRepository.findByStudentId(studentId));
    }

    @GetMapping("/student/{studentId}/subject/{subject}")
    public ResponseEntity<List<AiLearningProgress>> getByStudentAndSubject(
            @PathVariable UUID studentId,
            @PathVariable String subject,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        return ResponseEntity.ok(aiLearningProgressRepository.findByStudentIdAndSubject(studentId, subject));
    }

    @PostMapping
    public ResponseEntity<AiLearningProgress> create(
            @Valid @RequestBody AiLearningProgress progress,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, progress.getStudentId());
        return ResponseEntity.ok(aiLearningProgressRepository.save(progress));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AiLearningProgress> update(
            @PathVariable UUID id,
            @Valid @RequestBody AiLearningProgress details,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiLearningProgressRepository.findById(id).map(progress -> {
            academyStudentAccess.assertCanAccessStudentEntity(authUser, progress.getStudentId());
            if (details.getProficiencyScore() != null) {
                progress.setProficiencyScore(details.getProficiencyScore());
            }
            if (details.getSkillLevel() != null) {
                progress.setSkillLevel(details.getSkillLevel());
            }
            return ResponseEntity.ok(aiLearningProgressRepository.save(progress));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiLearningProgressRepository.findById(id)
                .map(row -> {
                    academyStudentAccess.assertCanAccessStudentEntity(authUser, row.getStudentId());
                    aiLearningProgressRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
