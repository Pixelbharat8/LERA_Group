package com.lera.connect_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

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
    
    @Column(name = "preferred_schedule", columnDefinition = "TEXT")
    private String preferredSchedule;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(length = 30)
    @Builder.Default
    private String status = "NEW"; // NEW, CONTACTED, QUALIFIED, TRIAL_BOOKED, TRIAL_ATTENDED, NO_SHOW, CONVERTED, LOST
    
    @Column(name = "assigned_to")
    private UUID assignedTo;
    
    @Column(name = "converted_student_id")
    private UUID convertedStudentId;
    
    @Column(name = "conversion_date")
    private LocalDate conversionDate;
    
    @Column(name = "utm_source", length = 100)
    private String utmSource;
    
    @Column(name = "utm_medium", length = 100)
    private String utmMedium;
    
    @Column(name = "utm_campaign", length = 100)
    private String utmCampaign;
    
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
    
    // Helper method to get full name (for compatibility)
    public String getFullName() {
        return parentName;
    }
}
