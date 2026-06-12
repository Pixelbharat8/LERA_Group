package com.lera.social_media_service.controller;

import com.lera.social_media_service.entity.LeadFollowup;
import com.lera.social_media_service.repository.LeadFollowupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/lead-followups")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class LeadFollowupController {
    
    private final LeadFollowupRepository leadFollowupRepository;
    
    @GetMapping
    public ResponseEntity<List<LeadFollowup>> getAllFollowups(Pageable pageable) {
        return ResponseEntity.ok(leadFollowupRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<LeadFollowup> getFollowupById(@PathVariable UUID id) {
        return leadFollowupRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<LeadFollowup>> getFollowupsByLead(@PathVariable UUID leadId) {
        return ResponseEntity.ok(leadFollowupRepository.findByLeadIdOrderByScheduledAtDesc(leadId));
    }
    
    @GetMapping("/assigned/{userId}")
    public ResponseEntity<List<LeadFollowup>> getFollowupsByAssignee(@PathVariable UUID userId) {
        return ResponseEntity.ok(leadFollowupRepository.findByAssignedToOrderByScheduledAtAsc(userId));
    }
    
    @GetMapping("/assigned/{userId}/pending")
    public ResponseEntity<List<LeadFollowup>> getPendingFollowupsByAssignee(@PathVariable UUID userId) {
        return ResponseEntity.ok(leadFollowupRepository.findByAssignedToAndStatusOrderByScheduledAtAsc(userId, "PENDING"));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<LeadFollowup>> getFollowupsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(leadFollowupRepository.findByStatusOrderByScheduledAtAsc(status));
    }
    
    @GetMapping("/today")
    public ResponseEntity<List<LeadFollowup>> getTodayFollowups() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return ResponseEntity.ok(leadFollowupRepository.findByScheduledAtBetweenAndStatus(startOfDay, endOfDay, "PENDING"));
    }
    
    @PostMapping
    public ResponseEntity<LeadFollowup> createFollowup(@Valid @RequestBody LeadFollowup followup) {
        followup.setCreatedAt(LocalDateTime.now());
        followup.setUpdatedAt(LocalDateTime.now());
        if (followup.getStatus() == null) {
            followup.setStatus("PENDING");
        }
        return ResponseEntity.ok(leadFollowupRepository.save(followup));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<LeadFollowup> updateFollowup(@PathVariable UUID id, @Valid @RequestBody LeadFollowup details) {
        return leadFollowupRepository.findById(id).map(followup -> {
            if (details.getFollowupType() != null) followup.setFollowupType(details.getFollowupType());
            if (details.getScheduledAt() != null) followup.setScheduledAt(details.getScheduledAt());
            if (details.getNotes() != null) followup.setNotes(details.getNotes());
            if (details.getAssignedTo() != null) followup.setAssignedTo(details.getAssignedTo());
            if (details.getStatus() != null) followup.setStatus(details.getStatus());
            followup.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(leadFollowupRepository.save(followup));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/complete")
    public ResponseEntity<LeadFollowup> completeFollowup(@PathVariable UUID id, @Valid @RequestBody Map<String, String> body) {
        return leadFollowupRepository.findById(id).map(followup -> {
            followup.setStatus("COMPLETED");
            followup.setCompletedAt(LocalDateTime.now());
            if (body.get("outcome") != null) {
                followup.setOutcome(body.get("outcome"));
            }
            followup.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(leadFollowupRepository.save(followup));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/cancel")
    public ResponseEntity<LeadFollowup> cancelFollowup(@PathVariable UUID id) {
        return leadFollowupRepository.findById(id).map(followup -> {
            followup.setStatus("CANCELLED");
            followup.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(leadFollowupRepository.save(followup));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFollowup(@PathVariable UUID id) {
        if (leadFollowupRepository.existsById(id)) {
            leadFollowupRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
