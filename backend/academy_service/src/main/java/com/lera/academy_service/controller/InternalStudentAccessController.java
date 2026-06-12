package com.lera.academy_service.controller;

import com.lera.academy_service.dto.InternalStudentRef;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Service-to-service student entity resolution for Connect (AI tutor, chat assignments).
 * Secured by {@link com.lera.academy_service.security.InternalApiKeyAuthFilter}.
 */
@RestController
@RequestMapping("/api/internal/students")
@RequiredArgsConstructor
public class InternalStudentAccessController {

    private final StudentRepository studentRepository;
    private final StudentParentRepository studentParentRepository;

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<InternalStudentRef> byAuthUser(@PathVariable UUID userId) {
        return studentRepository.findByUserId(userId)
                .map(s -> ResponseEntity.ok(new InternalStudentRef(s.getId(), s.getUserId(), s.getCenterId())))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Returns 204 when {@code userId} may view {@code studentId} (self student or linked parent);
     * 403 otherwise. Staff checks stay on the Connect caller — this endpoint is family binding only.
     */
    @GetMapping("/{studentId}/visible-to-user/{userId}")
    public ResponseEntity<Void> visibleToUser(
            @PathVariable UUID studentId,
            @PathVariable UUID userId) {
        if (userCanViewStudent(studentId, userId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    private boolean userCanViewStudent(UUID studentId, UUID userId) {
        if (studentParentRepository.existsByStudentIdAndParentId(studentId, userId)) {
            return true;
        }
        return studentRepository.findById(studentId)
                .map(s -> userId.equals(s.getUserId()))
                .orElse(false);
    }
}
