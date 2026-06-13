package com.lera.connect_service.controller;

import com.lera.connect_service.entity.EmailLog;
import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.repository.EmailLogRepository;
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
@RequestMapping("/api/email-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class EmailLogController {

    private final EmailLogRepository emailLogRepository;
    private final LeadRepository leadRepository;

    private Lead requireAccessibleLead(AuthUser user, UUID leadId) {
        if (leadId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "leadId is required");
        }
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
        ConnectSecurity.assertCanAccessLead(user, lead);
        return lead;
    }

    private void assertEmailLogAccess(AuthUser user, EmailLog log) {
        if (log == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (log.getLeadId() != null) {
            requireAccessibleLead(user, log.getLeadId());
            return;
        }
        UUID self = ConnectSecurity.requireUserId(user);
        if (log.getUserId() != null && self.equals(log.getUserId())) {
            return;
        }
        if (ConnectSecurity.isOrgWide(user)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access this email log");
    }

    @GetMapping
    public ResponseEntity<List<EmailLog>> getAllEmailLogs(
            @RequestParam(required = false) UUID centerId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        if (eff != null) {
            return ResponseEntity.ok(emailLogRepository.findByLeadCenterId(eff));
        }
        if (ConnectSecurity.isOrgWide(authUser)) {
            return ResponseEntity.ok(emailLogRepository.findAll(pageable).getContent());
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "centerId is required for email log list queries unless you have an org-wide role");
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmailLog> getEmailLogById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return emailLogRepository.findById(id)
                .map(log -> {
                    assertEmailLogAccess(authUser, log);
                    return ResponseEntity.ok(log);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<EmailLog>> getEmailLogsByLead(
            @PathVariable UUID leadId,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, leadId);
        return ResponseEntity.ok(emailLogRepository.findByLeadId(leadId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<EmailLog>> getEmailLogsByUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID self = ConnectSecurity.requireUserId(authUser);
        if (!ConnectSecurity.isOrgWide(authUser) && !self.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another user's email logs");
        }
        return ResponseEntity.ok(emailLogRepository.findByUserId(userId));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<List<EmailLog>> getEmailLogsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(emailLogRepository.findByEmailStatus(status));
    }

    @PostMapping
    public ResponseEntity<EmailLog> createEmailLog(
            @Valid @RequestBody EmailLog emailLog,
            @AuthenticationPrincipal AuthUser authUser) {
        if (emailLog.getLeadId() != null) {
            requireAccessibleLead(authUser, emailLog.getLeadId());
        }
        UUID self = ConnectSecurity.requireUserId(authUser);
        if (emailLog.getUserId() == null) {
            emailLog.setUserId(self);
        } else if (!self.equals(emailLog.getUserId()) && !ConnectSecurity.isOrgWide(authUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot create email logs for another user");
        }
        return ResponseEntity.ok(emailLogRepository.save(emailLog));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmailLog(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return emailLogRepository.findById(id)
                .map(log -> {
                    assertEmailLogAccess(authUser, log);
                    emailLogRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
