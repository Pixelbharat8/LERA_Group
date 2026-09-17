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

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
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

    /**
     * A follow-up row stores only leadId — no relation, no denormalised name. A list rendered
     * straight from it says "Unknown Lead" on every row, which is the one thing the person
     * working the queue needs to know. Resolve the leads in one query.
     */
    private List<Map<String, Object>> withLeadNames(List<Followup> followups) {
        Set<UUID> leadIds = followups.stream()
                .map(Followup::getLeadId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, Lead> byId = leadIds.isEmpty()
                ? Map.of()
                : leadRepository.findAllById(leadIds).stream()
                        .collect(Collectors.toMap(Lead::getId, l -> l, (a, b) -> a));

        List<Map<String, Object>> out = new ArrayList<>(followups.size());
        for (Followup f : followups) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", f.getId());
            row.put("leadId", f.getLeadId());
            row.put("userId", f.getUserId());
            row.put("actionType", f.getActionType());
            row.put("notes", f.getNotes());
            row.put("nextFollowupDate", f.getNextFollowupDate());
            row.put("scheduledAt", f.getScheduledAt());
            row.put("outcome", f.getOutcome());
            row.put("status", f.getStatus());
            row.put("createdAt", f.getCreatedAt());
            Lead lead = f.getLeadId() != null ? byId.get(f.getLeadId()) : null;
            row.put("leadName", lead != null ? lead.getParentName() : null);
            row.put("studentName", lead != null ? lead.getStudentName() : null);
            row.put("leadPhone", lead != null ? lead.getParentPhone() : null);
            out.add(row);
        }
        return out;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllFollowups(
            @RequestParam(required = false) UUID centerId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        if (eff != null) {
            return ResponseEntity.ok(withLeadNames(followupRepository.findByLeadCenterId(eff)));
        }
        if (ConnectSecurity.isOrgWide(authUser)) {
            return ResponseEntity.ok(withLeadNames(followupRepository.findAll(pageable).getContent()));
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
    public ResponseEntity<List<Map<String, Object>>> getFollowupsByLead(
            @PathVariable UUID leadId,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, leadId);
        return ResponseEntity.ok(withLeadNames(followupRepository.findByLeadId(leadId)));
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
            // status (PENDING/DONE/SKIPPED) was silently dropped, so completing a follow-up never
            // cleared it — the main CRM dashboard counts pending via status == "PENDING".
            if (details.getStatus() != null) followup.setStatus(details.getStatus());
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
