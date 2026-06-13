package com.lera.academy_service.controller;

import com.lera.academy_service.entity.StaffCertification;
import com.lera.academy_service.repository.StaffCertificationRepository;
import com.lera.academy_service.security.AcademyRoles;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Staff degrees / certificates / credentials. Staff manage their own; admins see all. DB-backed.
 */
@RestController
@RequestMapping("/api/staff-certifications")
@PreAuthorize(AcademyRoles.STAFF)
public class StaffCertificationController {

    private final StaffCertificationRepository repository;
    private final com.lera.academy_service.security.AcademyAuthorizationService authz;

    public StaffCertificationController(StaffCertificationRepository repository,
                                        com.lera.academy_service.security.AcademyAuthorizationService authz) {
        this.repository = repository;
        this.authz = authz;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<List<StaffCertification>> list(@RequestParam(required = false) UUID centerId) {
        UUID eff = authz.effectiveListCenterId(centerId);
        return ResponseEntity.ok(eff != null
                ? repository.findByCenterIdOrderByIssueDateDesc(eff)
                : repository.findAllByOrderByIssueDateDesc());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<StaffCertification>> byUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(repository.findByUserIdOrderByIssueDateDesc(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffCertification> getById(@PathVariable UUID id) {
        return repository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<StaffCertification> create(@Valid @RequestBody StaffCertification body) {
        body.setId(null);
        return ResponseEntity.ok(repository.save(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StaffCertification> update(@PathVariable UUID id, @Valid @RequestBody StaffCertification body) {
        return repository.findById(id).map(c -> {
            c.setName(body.getName());
            c.setIssuer(body.getIssuer());
            c.setIssueDate(body.getIssueDate());
            c.setExpiryDate(body.getExpiryDate());
            c.setCredentialId(body.getCredentialId());
            c.setFileUrl(body.getFileUrl());
            c.setNotes(body.getNotes());
            return ResponseEntity.ok(repository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
