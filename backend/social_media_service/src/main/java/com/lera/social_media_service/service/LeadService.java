package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.*;
import com.lera.social_media_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeadService {
    
    private final LeadRepository leadRepository;
    private final LeadFollowupRepository followupRepository;
    private final LeadActivityRepository activityRepository;
    
    // ===================== LEAD CRUD =====================
    
    public Lead createLead(Lead lead) {
        lead.setCreatedAt(LocalDateTime.now());
        lead.setStatus("NEW");
        
        Lead savedLead = leadRepository.save(lead);
        recordActivity(savedLead.getId(), "CREATED", "Lead created", null);
        
        return savedLead;
    }
    
    public Lead updateLead(UUID id, Lead leadDetails) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found: " + id));
        
        String oldStatus = lead.getStatus();
        
        if (leadDetails.getParentName() != null) lead.setParentName(leadDetails.getParentName());
        if (leadDetails.getParentEmail() != null) lead.setParentEmail(leadDetails.getParentEmail());
        if (leadDetails.getParentPhone() != null) lead.setParentPhone(leadDetails.getParentPhone());
        if (leadDetails.getStatus() != null) lead.setStatus(leadDetails.getStatus());
        if (leadDetails.getAssignedTo() != null) lead.setAssignedTo(leadDetails.getAssignedTo());
        if (leadDetails.getNotes() != null) lead.setNotes(leadDetails.getNotes());
        if (leadDetails.getLeadScore() != null) lead.setLeadScore(leadDetails.getLeadScore());
        
        lead.setUpdatedAt(LocalDateTime.now());
        
        if (!Objects.equals(oldStatus, lead.getStatus())) {
            recordActivity(id, "STATUS_CHANGED", "Status changed from " + oldStatus + " to " + lead.getStatus(), null);
        }
        
        return leadRepository.save(lead);
    }
    
    public void deleteLead(UUID id) {
        leadRepository.deleteById(id);
    }
    
    public Optional<Lead> getLeadById(UUID id) {
        return leadRepository.findById(id);
    }
    
    public Page<Lead> getAllLeads(Pageable pageable) {
        return leadRepository.findAll(pageable);
    }
    
    // ===================== LEAD QUERIES =====================
    
    public List<Lead> getLeadsByStatus(String status) {
        return leadRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    
    public List<Lead> getLeadsBySource(String source) {
        return leadRepository.findBySourcePlatform(source);
    }
    
    public List<Lead> getLeadsByCampaign(UUID campaignId) {
        return leadRepository.findByCampaignId(campaignId);
    }
    
    public List<Lead> getLeadsAssignedTo(UUID userId) {
        return leadRepository.findByAssignedTo(userId);
    }
    
    public List<Lead> getAllLeadsList() {
        return leadRepository.findAllByOrderByCreatedAtDesc();
    }
    
    // ===================== LEAD SCORING =====================
    
    public Lead updateLeadScore(UUID id, Integer score) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found: " + id));
        
        Integer oldScore = lead.getLeadScore();
        lead.setLeadScore(score);
        lead.setUpdatedAt(LocalDateTime.now());
        
        recordActivity(id, "SCORE_UPDATED", "Score updated from " + oldScore + " to " + score, null);
        
        return leadRepository.save(lead);
    }
    
    // ===================== LEAD ASSIGNMENT =====================
    
    public Lead assignLead(UUID leadId, UUID userId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found: " + leadId));
        
        lead.setAssignedTo(userId);
        lead.setUpdatedAt(LocalDateTime.now());
        
        recordActivity(leadId, "ASSIGNED", "Assigned to user " + userId, userId);
        
        return leadRepository.save(lead);
    }
    
    // ===================== LEAD CONVERSION =====================
    
    public Lead convertLead(UUID id, String conversionType) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found: " + id));
        
        lead.setStatus("CONVERTED");
        lead.setConversionDate(java.time.LocalDate.now());
        lead.setUpdatedAt(LocalDateTime.now());
        
        recordActivity(id, "CONVERTED", "Converted to " + conversionType, null);
        
        return leadRepository.save(lead);
    }
    
    // ===================== FOLLOW-UP MANAGEMENT =====================
    
    public LeadFollowup scheduleFollowup(UUID leadId, LeadFollowup followup) {
        // Verify lead exists
        if (!leadRepository.existsById(leadId)) {
            throw new RuntimeException("Lead not found: " + leadId);
        }
        
        followup.setLeadId(leadId);
        followup.setCreatedAt(LocalDateTime.now());
        followup.setStatus("SCHEDULED");
        
        recordActivity(leadId, "FOLLOWUP_SCHEDULED", 
                "Follow-up scheduled for " + followup.getScheduledAt(), 
                followup.getAssignedTo());
        
        return followupRepository.save(followup);
    }
    
    public LeadFollowup completeFollowup(UUID followupId, String outcome, String notes) {
        LeadFollowup followup = followupRepository.findById(followupId)
                .orElseThrow(() -> new RuntimeException("Follow-up not found: " + followupId));
        
        followup.setStatus("COMPLETED");
        followup.setOutcome(outcome);
        followup.setNotes(notes);
        followup.setCompletedAt(LocalDateTime.now());
        
        recordActivity(followup.getLeadId(), "FOLLOWUP_COMPLETED", 
                "Follow-up completed: " + outcome, followup.getAssignedTo());
        
        return followupRepository.save(followup);
    }
    
    public List<LeadFollowup> getUpcomingFollowups(UUID userId) {
        return followupRepository.findByAssignedToAndStatusOrderByScheduledAtAsc(userId, "SCHEDULED");
    }
    
    public List<LeadFollowup> getOverdueFollowups() {
        return followupRepository.findByStatusOrderByScheduledAtAsc("SCHEDULED").stream()
                .filter(f -> f.getScheduledAt() != null && f.getScheduledAt().isBefore(LocalDateTime.now()))
                .toList();
    }
    
    // ===================== ACTIVITY TRACKING =====================
    
    public void recordActivity(UUID leadId, String type, String description, UUID userId) {
        Lead lead = leadRepository.findById(leadId).orElse(null);
        if (lead == null) return;
        
        LeadActivity activity = new LeadActivity();
        activity.setLeadId(leadId);
        activity.setActivityType(type);
        activity.setDescription(description);
        activity.setPerformedBy(userId);
        activity.setCreatedAt(LocalDateTime.now());
        
        activityRepository.save(activity);
    }
    
    public List<LeadActivity> getLeadActivities(UUID leadId) {
        return activityRepository.findByLeadIdOrderByCreatedAtDesc(leadId);
    }
    
    // ===================== ANALYTICS =====================
    
    public Map<String, Object> getLeadAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        
        analytics.put("totalLeads", leadRepository.count());
        analytics.put("newLeads", leadRepository.countByStatus("NEW"));
        analytics.put("contactedLeads", leadRepository.countByStatus("CONTACTED"));
        analytics.put("qualifiedLeads", leadRepository.countByStatus("QUALIFIED"));
        analytics.put("convertedLeads", leadRepository.countByStatus("CONVERTED"));
        
        Map<String, Long> bySource = new HashMap<>();
        bySource.put("facebook", leadRepository.countBySourcePlatform("facebook"));
        bySource.put("instagram", leadRepository.countBySourcePlatform("instagram"));
        bySource.put("tiktok", leadRepository.countBySourcePlatform("tiktok"));
        bySource.put("website", leadRepository.countBySourcePlatform("website"));
        analytics.put("bySource", bySource);
        
        long totalLeads = leadRepository.count();
        long convertedLeads = leadRepository.countByStatus("CONVERTED");
        double conversionRate = totalLeads > 0 ? (double) convertedLeads / totalLeads * 100 : 0;
        analytics.put("conversionRate", conversionRate);
        
        return analytics;
    }
    
    public Map<String, Object> getLeadFunnel() {
        Map<String, Object> funnel = new LinkedHashMap<>();
        
        funnel.put("NEW", leadRepository.countByStatus("NEW"));
        funnel.put("CONTACTED", leadRepository.countByStatus("CONTACTED"));
        funnel.put("QUALIFIED", leadRepository.countByStatus("QUALIFIED"));
        funnel.put("CONVERTED", leadRepository.countByStatus("CONVERTED"));
        
        return funnel;
    }
}
