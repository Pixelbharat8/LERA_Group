package com.lera.payment_service.controller;

import com.lera.payment_service.entity.StudentScholarship;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.JdbcAuditWriter;
import com.lera.payment_service.service.StudentScholarshipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/student-scholarships")
@RequiredArgsConstructor
public class StudentScholarshipController {

    private final StudentScholarshipService studentScholarshipService;
    private final JdbcAuditWriter auditWriter;
    private final PaymentAccessService paymentAccess;

    @GetMapping
    public ResponseEntity<?> getAll(
            @AuthenticationPrincipal AuthUser authUser,
            Pageable pageable) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(studentScholarshipService.getAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentScholarship> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return studentScholarshipService.getById(id)
                .filter(ss -> paymentAccess.canViewStudentEntity(authUser, ss.getStudentId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentScholarship>> getByStudent(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        paymentAccess.assertCanViewStudentEntity(authUser, studentId);
        return ResponseEntity.ok(studentScholarshipService.getByStudent(studentId));
    }

    @GetMapping("/scholarship/{scholarshipId}")
    public ResponseEntity<List<StudentScholarship>> getByScholarship(
            @PathVariable UUID scholarshipId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(studentScholarshipService.getByScholarship(scholarshipId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<StudentScholarship> create(@Valid @RequestBody StudentScholarship studentScholarship) {
        StudentScholarship saved = studentScholarshipService.create(studentScholarship);
        auditWriter.log("STUDENT_SCHOLARSHIP_CREATED", "StudentScholarship", saved.getId(), null, null,
                "{\"studentId\":\"" + saved.getStudentId() + "\",\"scholarshipId\":\""
                        + saved.getScholarshipId() + "\"}");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        Optional<StudentScholarship> oldOpt = studentScholarshipService.getById(id);
        boolean deleted = studentScholarshipService.delete(id);
        if (deleted) {
            oldOpt.ifPresent(ss -> auditWriter.log("STUDENT_SCHOLARSHIP_DELETED", "StudentScholarship", id, null,
                    "{\"studentId\":\"" + ss.getStudentId() + "\"}", null));
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
