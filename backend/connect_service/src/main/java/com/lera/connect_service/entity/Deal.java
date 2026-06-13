package com.lera.connect_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "deals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deal {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "deal_code", unique = true)
    private String dealCode;
    
    @Column(name = "title", nullable = false)
    private String title;
    
    @Column(name = "lead_id")
    private UUID leadId;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "value")
    @Positive
    private BigDecimal value;
    
    @Column(name = "stage")
    private String stage; // PROSPECTING, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
    
    @Column(name = "probability")
    private Integer probability;
    
    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "assigned_to")
    private UUID assignedTo;
    
    @Column(name = "created_by")
    private UUID createdBy;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (dealCode == null || dealCode.isEmpty()) {
            dealCode = "DEAL-" + System.currentTimeMillis();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
