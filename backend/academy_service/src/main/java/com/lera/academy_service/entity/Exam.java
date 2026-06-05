package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "exams")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Exam {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "class_id")
    private UUID classId;
    
    @Column(name = "exam_type_id")
    private UUID examTypeId;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "exam_date")
    private LocalDate examDate;
    
    @Column(name = "max_score")
    @PositiveOrZero
    private BigDecimal maxScore;
    
    @Column(name = "passing_score")
    @PositiveOrZero
    private BigDecimal passingScore;
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes;
    
    private String description;
    
    @Column(name = "created_by")
    private UUID createdBy;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (maxScore == null) maxScore = new BigDecimal("100");
        if (passingScore == null) passingScore = new BigDecimal("50");
    }
}
