package com.lera.connect_service.controller;

import com.lera.connect_service.entity.CrmTrigger;
import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.repository.CrmTriggerRepository;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.JdbcAuditWriter;
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
@RequestMapping("/api/crm-triggers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
public class CrmTriggerController {

    private final CrmTriggerRepository crmTriggerRepository;
    private final LeadRepository leadRepository;
    private final JdbcAuditWriter auditWriter;

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private Lead requireAccessibleLead(AuthUser user, UUID leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
        ConnectSecurity.assertCanAccessLead(user, lead);
        return lead;
    }

    private void assertTriggerAccess(AuthUser user, CrmTrigger trigger) {
        if (trigger == null || trigger.getLeadId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        requireAccessibleLead(user, trigger.getLeadId());
    }

    private List<CrmTrigger> filterByCenter(AuthUser user, List<CrmTrigger> rows) {
        if (ConnectSecurity.isOrgWide(user)) {
            return rows;
        }
        UUID jwtCenter = user.getCenterId();
        if (jwtCenter == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return rows.stream()
                .filter(t -> leadRepository.findById(t.getLeadId())
                        .map(lead -> jwtCenter.equals(lead.getCenterId()))
                        .orElse(false))
                .toList();
    }

    @GetMapping
    public ResponseEntity<List<CrmTrigger>> getAllTriggers(
            @RequestParam(required = false) UUID centerId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        if (eff != null) {
            return ResponseEntity.ok(crmTriggerRepository.findByLeadCenterId(eff));
        }
        if (ConnectSecurity.isOrgWide(authUser)) {
            return ResponseEntity.ok(crmTriggerRepository.findAll(pageable).getContent());
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "centerId is required for CRM trigger list queries unless you have an org-wide role");
    }

    @GetMapping("/{id}")
    public ResponseEntity<CrmTrigger> getTriggerById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return crmTriggerRepository.findById(id)
                .map(t -> {
                    assertTriggerAccess(authUser, t);
                    return ResponseEntity.ok(t);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<CrmTrigger>> getTriggersByLead(
            @PathVariable UUID leadId,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, leadId);
        return ResponseEntity.ok(crmTriggerRepository.findByLeadId(leadId));
    }

    @GetMapping("/automation/{automationId}")
    public ResponseEntity<List<CrmTrigger>> getTriggersByAutomation(
            @PathVariable UUID automationId,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(filterByCenter(authUser, crmTriggerRepository.findByAutomationId(automationId)));
    }

    @PostMapping
    public ResponseEntity<CrmTrigger> createTrigger(
            @Valid @RequestBody CrmTrigger trigger,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, trigger.getLeadId());
        CrmTrigger saved = crmTriggerRepository.save(trigger);
        auditWriter.log("CRM_TRIGGER_CREATED", "CrmTrigger", saved.getId(), null, null,
                "{\"triggerEvent\":\"" + esc(saved.getTriggerEvent()) + "\"}");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrigger(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        Optional<CrmTrigger> opt = crmTriggerRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        CrmTrigger t = opt.get();
        assertTriggerAccess(authUser, t);
        auditWriter.log("CRM_TRIGGER_DELETED", "CrmTrigger", id, null,
                "{\"triggerEvent\":\"" + esc(t.getTriggerEvent()) + "\"}", null);
        crmTriggerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
