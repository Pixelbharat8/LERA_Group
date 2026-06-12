package com.lera.ai_gateway.controller;

import com.lera.ai_gateway.entity.LearningPath;
import com.lera.ai_gateway.repository.LearningPathRepository;
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
@RequestMapping("/api/ai/learning-paths")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class LearningPathController {

    private final LearningPathRepository learningPathRepository;
    private final AcademyStudentAccessClient academyStudentAccess;

    @GetMapping
    public ResponseEntity<List<LearningPath>> getAllLearningPaths(
            @RequestParam(required = false) UUID studentId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        if (studentId != null) {
            academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
            return ResponseEntity.ok(learningPathRepository.findByStudentId(studentId));
        }
        if (AiGatewaySecurity.isAcademyStaff(authUser)) {
            return ResponseEntity.ok(learningPathRepository.findAll(pageable).getContent());
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Specify studentId or use a staff role");
    }

    @GetMapping("/{id}")
    public ResponseEntity<LearningPath> getLearningPathById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return learningPathRepository.findById(id)
                .map(row -> {
                    academyStudentAccess.assertCanAccessStudentEntity(authUser, row.getStudentId());
                    return ResponseEntity.ok(row);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<LearningPath>> getLearningPathsByStudent(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        return ResponseEntity.ok(learningPathRepository.findByStudentId(studentId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<LearningPath>> getLearningPathsByStatus(
            @PathVariable String status,
            @AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertStaff(authUser);
        return ResponseEntity.ok(learningPathRepository.findByStatus(status));
    }

    @GetMapping("/student/{studentId}/status/{status}")
    public ResponseEntity<List<LearningPath>> getLearningPathsByStudentAndStatus(
            @PathVariable UUID studentId,
            @PathVariable String status,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        return ResponseEntity.ok(learningPathRepository.findByStudentIdAndStatus(studentId, status));
    }

    @PostMapping
    public ResponseEntity<LearningPath> createLearningPath(
            @Valid @RequestBody LearningPath learningPath,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, learningPath.getStudentId());
        return ResponseEntity.ok(learningPathRepository.save(learningPath));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LearningPath> updateLearningPath(
            @PathVariable UUID id,
            @Valid @RequestBody LearningPath pathDetails,
            @AuthenticationPrincipal AuthUser authUser) {
        return learningPathRepository.findById(id).map(learningPath -> {
            academyStudentAccess.assertCanAccessStudentEntity(authUser, learningPath.getStudentId());
            if (pathDetails.getStatus() != null) {
                learningPath.setStatus(pathDetails.getStatus());
            }
            return ResponseEntity.ok(learningPathRepository.save(learningPath));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status/{status}")
    public ResponseEntity<LearningPath> updateLearningPathStatus(
            @PathVariable UUID id,
            @PathVariable String status,
            @AuthenticationPrincipal AuthUser authUser) {
        return learningPathRepository.findById(id).map(learningPath -> {
            academyStudentAccess.assertCanAccessStudentEntity(authUser, learningPath.getStudentId());
            learningPath.setStatus(status);
            return ResponseEntity.ok(learningPathRepository.save(learningPath));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLearningPath(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return learningPathRepository.findById(id)
                .map(row -> {
                    academyStudentAccess.assertCanAccessStudentEntity(authUser, row.getStudentId());
                    learningPathRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
