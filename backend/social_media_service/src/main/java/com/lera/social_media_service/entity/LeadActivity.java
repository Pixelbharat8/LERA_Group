package com.lera.social_media_service.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "lead_activities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadActivity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "lead_id", nullable = false)
    private UUID leadId;
    
    @Column(name = "activity_type", length = 50, nullable = false)
    private String activityType; // STATUS_CHANGE, NOTE_ADDED, CALL_MADE, EMAIL_SENT, MEETING_SCHEDULED, ASSIGNED, CONVERTED
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "old_value")
    private String oldValue;
    
    @Column(name = "new_value")
    private String newValue;
    
    @Column(name = "performed_by")
    private UUID performedBy;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
