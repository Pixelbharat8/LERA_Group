package com.lera.social_media_service.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "lead_followups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadFollowup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "lead_id", nullable = false)
    private UUID leadId;
    
    @Column(name = "followup_type", length = 50)
    @Builder.Default
    private String followupType = "CALL"; // CALL, EMAIL, SMS, MEETING, WHATSAPP
    
    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Column(length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, COMPLETED, CANCELLED, MISSED
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(columnDefinition = "TEXT")
    private String outcome;
    
    @Column(name = "assigned_to")
    private UUID assignedTo;
    
    @Column(name = "created_by")
    private UUID createdBy;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
