package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.entity.LeadAssignment;
import com.lera.connect_service.repository.LeadAssignmentRepository;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.JdbcAuditWriter;
import com.lera.connect_service.service.LeadAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/lead-assignments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class LeadAssignmentController {

    private final LeadAssignmentService leadAssignmentService;
    private final LeadAssignmentRepository leadAssignmentRepository;
    private final LeadRepository leadRepository;
    private final JdbcAuditWriter auditWriter;

    private Lead requireAccessibleLead(AuthUser user, UUID leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
        ConnectSecurity.assertCanAccessLead(user, lead);
        return lead;
    }

    private void assertAssignmentAccess(AuthUser user, LeadAssignment assignment) {
        if (assignment == null || assignment.getLeadId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        requireAccessibleLead(user, assignment.getLeadId());
    }

    @GetMapping
    public ResponseEntity<List<LeadAssignment>> getAllAssignments(
            @RequestParam(required = false) UUID centerId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        if (eff != null) {
            return ResponseEntity.ok(leadAssignmentRepository.findByLeadCenterId(eff));
        }
        if (ConnectSecurity.isOrgWide(authUser)) {
            return ResponseEntity.ok(leadAssignmentService.getAll(pageable).getContent());
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "centerId is required for lead assignment list queries unless you have an org-wide role");
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeadAssignment> getAssignmentById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return leadAssignmentService.getById(id)
                .map(a -> {
                    assertAssignmentAccess(authUser, a);
                    return ResponseEntity.ok(a);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<LeadAssignment>> getAssignmentsByLead(
            @PathVariable UUID leadId,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, leadId);
        return ResponseEntity.ok(leadAssignmentService.getByLeadId(leadId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LeadAssignment>> getAssignmentsByUser(
            @PathVariable UUID userId,
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID self = ConnectSecurity.requireUserId(authUser);
        if (!ConnectSecurity.isOrgWide(authUser) && !self.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another user's assignments");
        }
        List<LeadAssignment> assignments = leadAssignmentService.getByAssignedTo(userId);
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        if (eff != null) {
            assignments = assignments.stream()
                    .filter(a -> leadRepository.findById(a.getLeadId())
                            .map(lead -> eff.equals(lead.getCenterId()))
                            .orElse(false))
                    .toList();
        } else if (!ConnectSecurity.isOrgWide(authUser)) {
            UUID jwtCenter = authUser.getCenterId();
            if (jwtCenter == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            assignments = assignments.stream()
                    .filter(a -> leadRepository.findById(a.getLeadId())
                            .map(lead -> jwtCenter.equals(lead.getCenterId()))
                            .orElse(false))
                    .toList();
        }
        return ResponseEntity.ok(assignments);
    }

    @PostMapping
    public ResponseEntity<LeadAssignment> createAssignment(
            @Valid @RequestBody LeadAssignment assignment,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, assignment.getLeadId());
        LeadAssignment saved = leadAssignmentService.create(assignment);
        auditWriter.log("LEAD_ASSIGNMENT_CREATED", "LeadAssignment", saved.getId(), null, null,
                "{\"leadId\":\"" + saved.getLeadId() + "\",\"assignedTo\":\"" + saved.getAssignedTo() + "\"}");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        Optional<LeadAssignment> existing = leadAssignmentService.getById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        assertAssignmentAccess(authUser, existing.get());
        if (!leadAssignmentService.delete(id)) {
            return ResponseEntity.notFound().build();
        }
        auditWriter.log("LEAD_ASSIGNMENT_DELETED", "LeadAssignment", id, null,
                "{\"leadId\":\"" + existing.get().getLeadId() + "\"}", null);
        return ResponseEntity.noContent().build();
    }
}
