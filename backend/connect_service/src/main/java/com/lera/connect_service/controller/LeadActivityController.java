package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.entity.LeadActivity;
import com.lera.connect_service.repository.LeadActivityRepository;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/lead-activities")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class LeadActivityController {

    private final LeadActivityRepository leadActivityRepository;
    private final LeadRepository leadRepository;

    private Lead requireAccessibleLead(AuthUser user, UUID leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
        ConnectSecurity.assertCanAccessLead(user, lead);
        return lead;
    }

    private void assertActivityAccess(AuthUser user, LeadActivity activity) {
        if (activity == null || activity.getLeadId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        requireAccessibleLead(user, activity.getLeadId());
    }

    @GetMapping
    public ResponseEntity<List<LeadActivity>> getAllActivities(
            @RequestParam(required = false) UUID centerId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        if (eff != null) {
            return ResponseEntity.ok(leadActivityRepository.findByLeadCenterId(eff));
        }
        if (ConnectSecurity.isOrgWide(authUser)) {
            return ResponseEntity.ok(leadActivityRepository.findAll(pageable).getContent());
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "centerId is required for lead activity list queries unless you have an org-wide role");
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeadActivity> getActivityById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return leadActivityRepository.findById(id)
                .map(a -> {
                    assertActivityAccess(authUser, a);
                    return ResponseEntity.ok(a);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<LeadActivity>> getActivitiesByLead(
            @PathVariable UUID leadId,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, leadId);
        return ResponseEntity.ok(leadActivityRepository.findByLeadId(leadId));
    }

    @GetMapping("/type/{activityType}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<List<LeadActivity>> getActivitiesByType(@PathVariable String activityType) {
        return ResponseEntity.ok(leadActivityRepository.findByActivityType(activityType));
    }

    @PostMapping
    public ResponseEntity<LeadActivity> createActivity(
            @Valid @RequestBody LeadActivity activity,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, activity.getLeadId());
        return ResponseEntity.ok(leadActivityRepository.save(activity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return leadActivityRepository.findById(id)
                .map(a -> {
                    assertActivityAccess(authUser, a);
                    leadActivityRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
