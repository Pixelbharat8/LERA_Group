package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Followup;
import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.repository.FollowupRepository;
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
@RequestMapping("/api/followups")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class FollowupController {

    private final FollowupRepository followupRepository;
    private final LeadRepository leadRepository;

    private Lead requireAccessibleLead(AuthUser user, UUID leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
        ConnectSecurity.assertCanAccessLead(user, lead);
        return lead;
    }

    private void assertFollowupAccess(AuthUser user, Followup followup) {
        if (followup == null || followup.getLeadId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        requireAccessibleLead(user, followup.getLeadId());
    }

    @GetMapping
    public ResponseEntity<List<Followup>> getAllFollowups(
            @RequestParam(required = false) UUID centerId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        if (eff != null) {
            return ResponseEntity.ok(followupRepository.findByLeadCenterId(eff));
        }
        if (ConnectSecurity.isOrgWide(authUser)) {
            return ResponseEntity.ok(followupRepository.findAll(pageable).getContent());
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "centerId is required for follow-up list queries unless you have an org-wide role");
    }

    @GetMapping("/{id}")
    public ResponseEntity<Followup> getFollowupById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return followupRepository.findById(id)
                .map(f -> {
                    assertFollowupAccess(authUser, f);
                    return ResponseEntity.ok(f);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<Followup>> getFollowupsByLead(
            @PathVariable UUID leadId,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, leadId);
        return ResponseEntity.ok(followupRepository.findByLeadId(leadId));
    }

    @PostMapping
    public ResponseEntity<Followup> createFollowup(
            @Valid @RequestBody Followup followup,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, followup.getLeadId());
        return ResponseEntity.ok(followupRepository.save(followup));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Followup> updateFollowup(
            @PathVariable UUID id,
            @Valid @RequestBody Followup details,
            @AuthenticationPrincipal AuthUser authUser) {
        return followupRepository.findById(id).map(followup -> {
            assertFollowupAccess(authUser, followup);
            if (details.getNextFollowupDate() != null) followup.setNextFollowupDate(details.getNextFollowupDate());
            if (details.getActionType() != null) followup.setActionType(details.getActionType());
            if (details.getNotes() != null) followup.setNotes(details.getNotes());
            if (details.getOutcome() != null) followup.setOutcome(details.getOutcome());
            return ResponseEntity.ok(followupRepository.save(followup));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFollowup(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return followupRepository.findById(id)
                .map(f -> {
                    assertFollowupAccess(authUser, f);
                    followupRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
