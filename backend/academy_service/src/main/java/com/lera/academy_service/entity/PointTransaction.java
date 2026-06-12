package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "point_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointTransaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "student_id", nullable = false)
    private UUID studentId;
    
    @Column(nullable = false)
    private Integer points;
    
    @Column(name = "transaction_type", length = 50)
    private String transactionType; // EARNED, SPENT, BONUS, PENALTY
    
    @Column(length = 100)
    private String reason; // ATTENDANCE, HOMEWORK, QUIZ, EXAM, PARTICIPATION, REDEMPTION
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "reference_id")
    private UUID referenceId;
    
    @Column(name = "reference_type", length = 50)
    private String referenceType; // CLASS, QUIZ, ASSIGNMENT, etc.
    
    @Column(name = "awarded_by")
    private UUID awardedBy;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
