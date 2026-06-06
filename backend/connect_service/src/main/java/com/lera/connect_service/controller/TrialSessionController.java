package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.entity.TrialSession;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.repository.TrialSessionRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Trial / placement class funnel for CRM leads. Booking a trial advances the lead through
 * TRIAL_BOOKED → TRIAL_ATTENDED / NO_SHOW → CONVERTED. Centre-scoped via {@link ConnectSecurity}.
 */
@RestController
@RequestMapping("/api/trial-sessions")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','STAFF')")
public class TrialSessionController {

    private final TrialSessionRepository trialRepository;
    private final LeadRepository leadRepository;

    public TrialSessionController(TrialSessionRepository trialRepository, LeadRepository leadRepository) {
        this.trialRepository = trialRepository;
        this.leadRepository = leadRepository;
    }

    @GetMapping
    public ResponseEntity<List<TrialSession>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        List<TrialSession> result;
        if (eff != null) {
            result = (status != null && !status.isBlank())
                    ? trialRepository.findByCenterIdAndStatusOrderByScheduledAtDesc(eff, status)
                    : trialRepository.findByCenterIdOrderByScheduledAtDesc(eff);
        } else if (status != null && !status.isBlank()) {
            result = trialRepository.findByStatusOrderByScheduledAtDesc(status);
        } else {
            result = trialRepository.findAllByOrderByScheduledAtDesc();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrialSession> getById(@PathVariable UUID id,
                                                @AuthenticationPrincipal AuthUser authUser) {
        TrialSession trial = require(id);
        assertAccess(authUser, trial.getLeadId());
        return ResponseEntity.ok(trial);
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<TrialSession>> byLead(@PathVariable UUID leadId,
                                                     @AuthenticationPrincipal AuthUser authUser) {
        assertAccess(authUser, leadId);
        return ResponseEntity.ok(trialRepository.findByLeadIdOrderByScheduledAtDesc(leadId));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<TrialSession>> upcoming(
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal AuthUser authUser) {
        int safe = Math.max(1, Math.min(limit, 100));
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, null);
        LocalDateTime now = LocalDateTime.now();
        List<TrialSession> result = (eff != null)
                ? trialRepository.findByCenterIdAndScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
                        eff, now, "BOOKED", PageRequest.of(0, safe))
                : trialRepository.findByScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
                        now, "BOOKED", PageRequest.of(0, safe));
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<TrialSession> book(@Valid @RequestBody TrialSession body,
                                             @AuthenticationPrincipal AuthUser authUser) {
        Lead lead = loadLead(body.getLeadId());
        assertAccess(authUser, lead);

        body.setId(null);
        body.setStatus("BOOKED");
        if (body.getCenterId() == null) body.setCenterId(lead.getCenterId());
        if (body.getProgramId() == null) body.setProgramId(lead.getInterestedProgramId());
        if (body.getAssignedTo() == null) body.setAssignedTo(lead.getAssignedTo());
        body.setCreatedBy(ConnectSecurity.requireUserId(authUser));
        TrialSession saved = trialRepository.save(body);

        advanceLead(lead, "TRIAL_BOOKED");
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrialSession> update(@PathVariable UUID id,
                                               @Valid @RequestBody TrialSession body,
                                               @AuthenticationPrincipal AuthUser authUser) {
        TrialSession trial = require(id);
        assertAccess(authUser, trial.getLeadId());
        trial.setScheduledAt(body.getScheduledAt());
        trial.setDurationMinutes(body.getDurationMinutes());
        trial.setTeacherId(body.getTeacherId());
        trial.setLocation(body.getLocation());
        trial.setProgramId(body.getProgramId());
        trial.setAssignedTo(body.getAssignedTo());
        if (body.getOutcomeNotes() != null) trial.setOutcomeNotes(body.getOutcomeNotes());
        return ResponseEntity.ok(trialRepository.save(trial));
    }

    @PostMapping("/{id}/attended")
    public ResponseEntity<TrialSession> attended(@PathVariable UUID id,
                                                 @RequestBody(required = false) Map<String, Object> body,
                                                 @AuthenticationPrincipal AuthUser authUser) {
        TrialSession trial = require(id);
        Lead lead = loadLead(trial.getLeadId());
        assertAccess(authUser, lead);
        trial.setStatus("ATTENDED");
        if (body != null) {
            if (body.get("placementLevel") != null) trial.setPlacementLevel(body.get("placementLevel").toString());
            if (body.get("outcomeNotes") != null) trial.setOutcomeNotes(body.get("outcomeNotes").toString());
        }
        TrialSession saved = trialRepository.save(trial);
        advanceLead(lead, "TRIAL_ATTENDED");
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/no-show")
    public ResponseEntity<TrialSession> noShow(@PathVariable UUID id,
                                               @RequestBody(required = false) Map<String, Object> body,
                                               @AuthenticationPrincipal AuthUser authUser) {
        TrialSession trial = require(id);
        Lead lead = loadLead(trial.getLeadId());
        assertAccess(authUser, lead);
        trial.setStatus("NO_SHOW");
        if (body != null && body.get("outcomeNotes") != null) trial.setOutcomeNotes(body.get("outcomeNotes").toString());
        TrialSession saved = trialRepository.save(trial);
        advanceLead(lead, "NO_SHOW");
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<TrialSession> convert(@PathVariable UUID id,
                                                @RequestBody(required = false) Map<String, Object> body,
                                                @AuthenticationPrincipal AuthUser authUser) {
        TrialSession trial = require(id);
        Lead lead = loadLead(trial.getLeadId());
        assertAccess(authUser, lead);

        UUID studentId = null;
        if (body != null && body.get("convertedStudentId") != null) {
            try {
                studentId = UUID.fromString(body.get("convertedStudentId").toString());
            } catch (IllegalArgumentException ignored) { /* leave null */ }
        }
        LocalDate today = LocalDate.now();
        trial.setStatus("CONVERTED");
        trial.setConvertedStudentId(studentId);
        trial.setConversionDate(today);
        TrialSession saved = trialRepository.save(trial);

        lead.setStatus("CONVERTED");
        lead.setConversionDate(today);
        if (studentId != null) lead.setConvertedStudentId(studentId);
        leadRepository.save(lead);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<TrialSession> cancel(@PathVariable UUID id,
                                               @RequestBody(required = false) Map<String, Object> body,
                                               @AuthenticationPrincipal AuthUser authUser) {
        TrialSession trial = require(id);
        assertAccess(authUser, trial.getLeadId());
        trial.setStatus("CANCELLED");
        if (body != null && body.get("outcomeNotes") != null) trial.setOutcomeNotes(body.get("outcomeNotes").toString());
        return ResponseEntity.ok(trialRepository.save(trial));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal AuthUser authUser) {
        TrialSession trial = require(id);
        assertAccess(authUser, trial.getLeadId());
        trialRepository.delete(trial);
        return ResponseEntity.noContent().build();
    }

    // ---- helpers ----

    private TrialSession require(UUID id) {
        return trialRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trial session not found"));
    }

    private Lead loadLead(UUID leadId) {
        return leadRepository.findById(leadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
    }

    private void assertAccess(AuthUser authUser, UUID leadId) {
        assertAccess(authUser, loadLead(leadId));
    }

    private void assertAccess(AuthUser authUser, Lead lead) {
        ConnectSecurity.assertCanAccessLead(authUser, lead);
    }

    /** Move the lead forward, but never override a terminal CONVERTED/LOST state. */
    private void advanceLead(Lead lead, String newStatus) {
        String current = lead.getStatus();
        if ("CONVERTED".equals(current) || "LOST".equals(current)) return;
        lead.setStatus(newStatus);
        leadRepository.save(lead);
    }
}
