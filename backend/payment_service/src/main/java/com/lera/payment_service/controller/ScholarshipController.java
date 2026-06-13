package com.lera.payment_service.controller;

import com.lera.payment_service.entity.Scholarship;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.JdbcAuditWriter;
import com.lera.payment_service.service.ScholarshipService;
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
@RequestMapping("/api/scholarships")
@RequiredArgsConstructor
public class ScholarshipController {

    private final ScholarshipService scholarshipService;
    private final JdbcAuditWriter auditWriter;
    private final PaymentAccessService paymentAccess;

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    @GetMapping
    public ResponseEntity<?> getAllScholarships(
            @AuthenticationPrincipal AuthUser authUser,
            Pageable pageable) {
        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(scholarshipService.getAllScholarships(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Scholarship> getScholarshipById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return scholarshipService.getScholarshipById(id)
                .map(s -> {
                    if (Boolean.TRUE.equals(s.getIsActive())) {
                        return ResponseEntity.ok(s);
                    }
                    paymentAccess.assertPrivilegedStaff(authUser);
                    return ResponseEntity.ok(s);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Scholarship>> getActiveScholarships() {
        return ResponseEntity.ok(scholarshipService.getActiveScholarships());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Scholarship> createScholarship(@Valid @RequestBody Scholarship scholarship) {
        Scholarship saved = scholarshipService.createScholarship(scholarship);
        auditWriter.log("SCHOLARSHIP_CREATED", "Scholarship", saved.getId(), null, null,
                "{\"scholarshipName\":\"" + esc(saved.getScholarshipName()) + "\"}");
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Scholarship> updateScholarship(@PathVariable UUID id, @Valid @RequestBody Scholarship details) {
        Optional<Scholarship> oldOpt = scholarshipService.getScholarshipById(id);
        return scholarshipService.updateScholarship(id, details)
                .map(updated -> {
                    oldOpt.ifPresent(old -> auditWriter.log("SCHOLARSHIP_UPDATED", "Scholarship", id, null,
                            "{\"scholarshipCode\":\"" + esc(old.getScholarshipCode()) + "\"}",
                            "{\"scholarshipCode\":\"" + esc(updated.getScholarshipCode()) + "\"}"));
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteScholarship(@PathVariable UUID id) {
        Optional<Scholarship> oldOpt = scholarshipService.getScholarshipById(id);
        boolean deleted = scholarshipService.deleteScholarship(id);
        if (deleted) {
            oldOpt.ifPresent(old -> auditWriter.log("SCHOLARSHIP_DELETED", "Scholarship", id, null,
                    "{\"scholarshipName\":\"" + esc(old.getScholarshipName()) + "\"}", null));
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
