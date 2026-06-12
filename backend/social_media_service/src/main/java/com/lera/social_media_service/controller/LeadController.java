package com.lera.social_media_service.controller;

import com.lera.social_media_service.entity.Lead;
import com.lera.social_media_service.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class LeadController {
    
    private final LeadRepository leadRepository;
    
    @GetMapping
    public ResponseEntity<List<Lead>> getAllLeads() {
        return ResponseEntity.ok(leadRepository.findAllByOrderByCreatedAtDesc());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Lead> getLeadById(@PathVariable UUID id) {
        return leadRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Lead>> getLeadsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(leadRepository.findByStatusOrderByCreatedAtDesc(status));
    }
    
    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<Lead>> getLeadsByCenter(@PathVariable UUID centerId) {
        return ResponseEntity.ok(leadRepository.findByCenterIdOrderByCreatedAtDesc(centerId));
    }
    
    @GetMapping("/campaign/{campaignId}")
    public ResponseEntity<List<Lead>> getLeadsByCampaign(@PathVariable UUID campaignId) {
        return ResponseEntity.ok(leadRepository.findByCampaignId(campaignId));
    }
    
    @GetMapping("/platform/{platform}")
    public ResponseEntity<List<Lead>> getLeadsByPlatform(@PathVariable String platform) {
        return ResponseEntity.ok(leadRepository.findBySourcePlatform(platform));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getLeadStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("newCount", leadRepository.countByStatus("NEW"));
        stats.put("contactedCount", leadRepository.countByStatus("CONTACTED"));
        stats.put("qualifiedCount", leadRepository.countByStatus("QUALIFIED"));
        stats.put("convertedCount", leadRepository.countByStatus("CONVERTED"));
        stats.put("lostCount", leadRepository.countByStatus("LOST"));
        stats.put("totalCount", leadRepository.count());
        
        // By platform
        stats.put("facebookCount", leadRepository.countBySourcePlatform("facebook"));
        stats.put("instagramCount", leadRepository.countBySourcePlatform("instagram"));
        stats.put("tiktokCount", leadRepository.countBySourcePlatform("tiktok"));
        stats.put("websiteCount", leadRepository.countBySourcePlatform("website"));
        
        return ResponseEntity.ok(stats);
    }
    
    @PostMapping
    public ResponseEntity<Lead> createLead(@Valid @RequestBody Lead lead) {
        lead.setCreatedAt(LocalDateTime.now());
        lead.setUpdatedAt(LocalDateTime.now());
        if (lead.getStatus() == null) {
            lead.setStatus("NEW");
        }
        return ResponseEntity.ok(leadRepository.save(lead));
    }
    
    @PostMapping("/bulk")
    public ResponseEntity<List<Lead>> createLeadsBulk(@Valid @RequestBody List<Lead> leads) {
        leads.forEach(lead -> {
            lead.setCreatedAt(LocalDateTime.now());
            lead.setUpdatedAt(LocalDateTime.now());
            if (lead.getStatus() == null) {
                lead.setStatus("NEW");
            }
        });
        return ResponseEntity.ok(leadRepository.saveAll(leads));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Lead> updateLead(@PathVariable UUID id, @Valid @RequestBody Lead details) {
        return leadRepository.findById(id).map(lead -> {
            if (details.getParentName() != null) lead.setParentName(details.getParentName());
            if (details.getParentEmail() != null) lead.setParentEmail(details.getParentEmail());
            if (details.getParentPhone() != null) lead.setParentPhone(details.getParentPhone());
            if (details.getStudentName() != null) lead.setStudentName(details.getStudentName());
            if (details.getStudentAge() != null) lead.setStudentAge(details.getStudentAge());
            if (details.getStatus() != null) lead.setStatus(details.getStatus());
            if (details.getAssignedTo() != null) lead.setAssignedTo(details.getAssignedTo());
            if (details.getNotes() != null) lead.setNotes(details.getNotes());
            if (details.getLeadScore() != null) lead.setLeadScore(details.getLeadScore());
            lead.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(leadRepository.save(lead));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<Lead> updateLeadStatus(@PathVariable UUID id, @Valid @RequestBody Map<String, String> body) {
        return leadRepository.findById(id).map(lead -> {
            String status = body.get("status");
            if (status != null) {
                lead.setStatus(status);
            }
            lead.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(leadRepository.save(lead));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/assign")
    public ResponseEntity<Lead> assignLead(@PathVariable UUID id, @Valid @RequestBody Map<String, String> body) {
        return leadRepository.findById(id).map(lead -> {
            if (body.get("assignedTo") != null) {
                lead.setAssignedTo(UUID.fromString(body.get("assignedTo")));
            }
            lead.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(leadRepository.save(lead));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLead(@PathVariable UUID id) {
        if (leadRepository.existsById(id)) {
            leadRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
