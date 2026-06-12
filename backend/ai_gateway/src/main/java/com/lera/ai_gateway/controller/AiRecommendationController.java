package com.lera.ai_gateway.controller;

import com.lera.ai_gateway.entity.AiRecommendation;
import com.lera.ai_gateway.repository.AiRecommendationRepository;
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
@RequestMapping("/api/ai/student-recommendations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER','TEACHER','TA','TEACHING_ASSISTANT')")
public class AiRecommendationController {

    private final AiRecommendationRepository aiRecommendationRepository;
    private final AcademyStudentAccessClient academyStudentAccess;

    @GetMapping
    public ResponseEntity<List<AiRecommendation>> getAllRecommendations(
            @RequestParam(required = false) UUID studentId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        if (studentId != null) {
            academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
            return ResponseEntity.ok(aiRecommendationRepository.findByStudentId(studentId));
        }
        return ResponseEntity.ok(aiRecommendationRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AiRecommendation> getRecommendationById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiRecommendationRepository.findById(id)
                .map(row -> {
                    academyStudentAccess.assertCanAccessStudentEntity(authUser, row.getStudentId());
                    return ResponseEntity.ok(row);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AiRecommendation>> getRecommendationsByStudent(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        return ResponseEntity.ok(aiRecommendationRepository.findByStudentId(studentId));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<AiRecommendation>> getRecommendationsByType(@PathVariable String type) {
        return ResponseEntity.ok(aiRecommendationRepository.findByRecommendationType(type));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<AiRecommendation>> getRecommendationsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(aiRecommendationRepository.findByStatus(status));
    }

    @PostMapping
    public ResponseEntity<AiRecommendation> createRecommendation(
            @Valid @RequestBody AiRecommendation recommendation,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, recommendation.getStudentId());
        return ResponseEntity.ok(aiRecommendationRepository.save(recommendation));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AiRecommendation> updateRecommendation(
            @PathVariable UUID id,
            @Valid @RequestBody AiRecommendation recommendationDetails,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiRecommendationRepository.findById(id).map(recommendation -> {
            academyStudentAccess.assertCanAccessStudentEntity(authUser, recommendation.getStudentId());
            if (recommendationDetails.getRecommendationType() != null) {
                recommendation.setRecommendationType(recommendationDetails.getRecommendationType());
            }
            if (recommendationDetails.getStatus() != null) {
                recommendation.setStatus(recommendationDetails.getStatus());
            }
            return ResponseEntity.ok(aiRecommendationRepository.save(recommendation));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status/{status}")
    public ResponseEntity<AiRecommendation> updateRecommendationStatus(
            @PathVariable UUID id,
            @PathVariable String status,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiRecommendationRepository.findById(id).map(recommendation -> {
            academyStudentAccess.assertCanAccessStudentEntity(authUser, recommendation.getStudentId());
            recommendation.setStatus(status);
            return ResponseEntity.ok(aiRecommendationRepository.save(recommendation));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecommendation(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiRecommendationRepository.findById(id)
                .map(row -> {
                    academyStudentAccess.assertCanAccessStudentEntity(authUser, row.getStudentId());
                    aiRecommendationRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
