package com.lera.connect_service.controller;

import com.lera.connect_service.entity.LeadTag;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.LeadTagService;
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
@RequestMapping("/api/lead-tags")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class LeadTagController {

    private final LeadTagService leadTagService;

    /** Global tag catalog — readable by all CRM roles; not center-scoped. */
    @GetMapping
    public ResponseEntity<List<LeadTag>> getAllTags(Pageable pageable) {
        return ResponseEntity.ok(leadTagService.getAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeadTag> getTagById(@PathVariable UUID id) {
        return leadTagService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<LeadTag> createTag(
            @Valid @RequestBody LeadTag tag,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isOrgWide(authUser) && authUser.getCenterId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(leadTagService.create(tag));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<LeadTag> updateTag(
            @PathVariable UUID id,
            @Valid @RequestBody LeadTag details,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isOrgWide(authUser) && authUser.getCenterId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return leadTagService.update(id, details)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteTag(@PathVariable UUID id) {
        if (leadTagService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
