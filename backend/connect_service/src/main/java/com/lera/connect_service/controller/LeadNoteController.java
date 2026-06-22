package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.entity.LeadNote;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.LeadNoteService;
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
@RequestMapping("/api/lead-notes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class LeadNoteController {

    private final LeadNoteService leadNoteService;
    private final LeadRepository leadRepository;

    private Lead requireAccessibleLead(AuthUser user, UUID leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
        ConnectSecurity.assertCanAccessLead(user, lead);
        return lead;
    }

    private void assertNoteAccess(AuthUser user, LeadNote note) {
        if (note == null || note.getLeadId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        requireAccessibleLead(user, note.getLeadId());
    }

    @GetMapping
    public ResponseEntity<List<LeadNote>> getAllNotes(
            @RequestParam(required = false) UUID centerId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        if (eff != null) {
            return ResponseEntity.ok(leadNoteService.getByLeadCenterId(eff));
        }
        if (ConnectSecurity.isOrgWide(authUser)) {
            return ResponseEntity.ok(leadNoteService.getAll(pageable).getContent());
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "centerId is required for lead note list queries unless you have an org-wide role");
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeadNote> getNoteById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return leadNoteService.getById(id)
                .map(note -> {
                    assertNoteAccess(authUser, note);
                    return ResponseEntity.ok(note);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<LeadNote>> getNotesByLead(
            @PathVariable UUID leadId,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, leadId);
        return ResponseEntity.ok(leadNoteService.getByLeadId(leadId));
    }

    @PostMapping
    public ResponseEntity<LeadNote> createNote(
            @Valid @RequestBody LeadNote note,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, note.getLeadId());
        // created_by is NOT NULL — stamp the author from the authenticated user.
        if (note.getCreatedBy() == null && authUser != null) {
            note.setCreatedBy(authUser.getUserId());
        }
        return ResponseEntity.ok(leadNoteService.create(note));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LeadNote> updateNote(
            @PathVariable UUID id,
            @Valid @RequestBody LeadNote details,
            @AuthenticationPrincipal AuthUser authUser) {
        return leadNoteService.getById(id)
                .map(existing -> {
                    assertNoteAccess(authUser, existing);
                    return leadNoteService.update(id, details)
                            .map(ResponseEntity::ok)
                            .orElse(ResponseEntity.notFound().build());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return leadNoteService.getById(id)
                .map(note -> {
                    assertNoteAccess(authUser, note);
                    if (leadNoteService.delete(id)) {
                        return ResponseEntity.noContent().<Void>build();
                    }
                    return ResponseEntity.notFound().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
