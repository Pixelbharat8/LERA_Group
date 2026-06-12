package com.lera.connect_service.controller;

import com.lera.connect_service.entity.LeadStatus;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.LeadStatusService;
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
@RequestMapping("/api/lead-statuses")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class LeadStatusController {

    private final LeadStatusService leadStatusService;

    /** Global status catalog — readable by all CRM roles. */
    @GetMapping
    public ResponseEntity<List<LeadStatus>> getAllStatuses(Pageable pageable) {
        return ResponseEntity.ok(leadStatusService.getAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeadStatus> getStatusById(@PathVariable UUID id) {
        return leadStatusService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<LeadStatus> createStatus(
            @Valid @RequestBody LeadStatus status,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isOrgWide(authUser) && authUser.getCenterId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(leadStatusService.create(status));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<LeadStatus> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody LeadStatus details,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isOrgWide(authUser) && authUser.getCenterId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return leadStatusService.update(id, details)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteStatus(@PathVariable UUID id) {
        if (leadStatusService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
