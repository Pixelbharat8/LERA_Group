package com.lera.connect_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lead_followups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Followup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "lead_id", nullable = false)
    private UUID leadId;
    
    @Column(name = "user_id")
    private UUID userId;
    
    @Column(name = "action_type", length = 50, nullable = false)
    private String actionType; // PHONE, EMAIL, SMS, MEETING, OTHER
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "next_followup_date")
    private LocalDate nextFollowupDate;
    
    @Column(name = "outcome", length = 50)
    private String outcome; // INTERESTED, NOT_INTERESTED, CALLBACK, NO_ANSWER, CONVERTED
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
