package com.lera.social_media_service.entity;

import java.time.LocalDate;
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
@Table(name = "leads")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lead {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "source_id")
    private UUID sourceId;

    @Column(name = "source_platform")
    private String sourcePlatform; // facebook, instagram, tiktok, website, referral
    
    @Column(name = "campaign_id")
    private UUID campaignId;
    
    @Column(name = "parent_name", nullable = false)
    private String parentName;
    
    @Column(name = "parent_phone", nullable = false, length = 50)
    private String parentPhone;
    
    @Column(name = "parent_email")
    private String parentEmail;
    
    @Column(name = "student_name")
    private String studentName;
    
    @Column(name = "student_age")
    private Integer studentAge;
    
    @Column(name = "interested_program_id")
    private UUID interestedProgramId;

    @Column(name = "interested_program_name")
    private String interestedProgramName;
    
    @Column(name = "preferred_schedule", columnDefinition = "TEXT")
    private String preferredSchedule;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(length = 30)
    @Builder.Default
    private String status = "NEW"; // NEW, CONTACTED, QUALIFIED, CONVERTED, LOST
    
    @Column(name = "assigned_to")
    private UUID assignedTo;
    
    @Column(name = "converted_student_id")
    private UUID convertedStudentId;
    
    @Column(name = "conversion_date")
    private LocalDate conversionDate;

    @Column(name = "lead_score")
    @Builder.Default
    private Integer leadScore = 0;
    
    // UTM Tracking
    @Column(name = "utm_source", length = 100)
    private String utmSource;
    
    @Column(name = "utm_medium", length = 100)
    private String utmMedium;
    
    @Column(name = "utm_campaign", length = 100)
    private String utmCampaign;

    @Column(name = "utm_content", length = 100)
    private String utmContent;

    @Column(name = "utm_term", length = 100)
    private String utmTerm;

    // Landing Page
    @Column(name = "landing_page", columnDefinition = "TEXT")
    private String landingPage;

    @Column(name = "referrer_url", columnDefinition = "TEXT")
    private String referrerUrl;
    
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
