package com.lera.connect_service.controller;

import com.lera.connect_service.entity.CrmAutomation;
import com.lera.connect_service.repository.CrmAutomationRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/crm-automations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
public class CrmAutomationController {

    private final CrmAutomationRepository crmAutomationRepository;

    private static void assertOrgWideMutate(AuthUser user) {
        if (!ConnectSecurity.isOrgWide(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Creating or changing CRM automations requires an org-wide role");
        }
    }

    /** Global automation catalog — readable by all CRM management roles. */
    @GetMapping
    public ResponseEntity<List<CrmAutomation>> getAllAutomations(Pageable pageable) {
        return ResponseEntity.ok(crmAutomationRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CrmAutomation> getAutomationById(@PathVariable UUID id) {
        return crmAutomationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public ResponseEntity<List<CrmAutomation>> getActiveAutomations() {
        return ResponseEntity.ok(crmAutomationRepository.findByIsActiveTrue());
    }

    @GetMapping("/trigger/{triggerType}")
    public ResponseEntity<List<CrmAutomation>> getAutomationsByTrigger(@PathVariable String triggerType) {
        return ResponseEntity.ok(crmAutomationRepository.findByTriggerType(triggerType));
    }

    @PostMapping
    public ResponseEntity<CrmAutomation> createAutomation(
            @Valid @RequestBody CrmAutomation automation,
            @AuthenticationPrincipal AuthUser authUser) {
        assertOrgWideMutate(authUser);
        UUID self = ConnectSecurity.requireUserId(authUser);
        if (automation.getCreatedBy() == null) {
            automation.setCreatedBy(self);
        }
        return ResponseEntity.ok(crmAutomationRepository.save(automation));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CrmAutomation> updateAutomation(
            @PathVariable UUID id,
            @Valid @RequestBody CrmAutomation details,
            @AuthenticationPrincipal AuthUser authUser) {
        assertOrgWideMutate(authUser);
        return crmAutomationRepository.findById(id).map(automation -> {
            if (details.getAutomationName() != null) automation.setAutomationName(details.getAutomationName());
            if (details.getDescription() != null) automation.setDescription(details.getDescription());
            if (details.getTriggerType() != null) automation.setTriggerType(details.getTriggerType());
            if (details.getTriggerConditions() != null) automation.setTriggerConditions(details.getTriggerConditions());
            if (details.getActions() != null) automation.setActions(details.getActions());
            if (details.getIsActive() != null) automation.setIsActive(details.getIsActive());
            return ResponseEntity.ok(crmAutomationRepository.save(automation));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/execute")
    public ResponseEntity<CrmAutomation> markExecuted(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        assertOrgWideMutate(authUser);
        return crmAutomationRepository.findById(id).map(automation -> {
            automation.setExecutionCount(automation.getExecutionCount() + 1);
            automation.setLastExecutedAt(LocalDateTime.now());
            return ResponseEntity.ok(crmAutomationRepository.save(automation));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAutomation(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        assertOrgWideMutate(authUser);
        if (crmAutomationRepository.existsById(id)) {
            crmAutomationRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
