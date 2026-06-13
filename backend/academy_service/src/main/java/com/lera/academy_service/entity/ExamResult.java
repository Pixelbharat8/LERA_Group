package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "exam_results", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"exam_id", "student_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamResult {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "exam_id")
    private UUID examId;
    
    @Column(name = "student_id")
    private UUID studentId;
    
    @Column(precision = 5, scale = 2)
    @PositiveOrZero
    private BigDecimal score;
    
    @Column(precision = 5, scale = 2)
    @PositiveOrZero
    @DecimalMax(value = "100", inclusive = true)
    private BigDecimal percentage;
    
    @Column(length = 10)
    private String grade;
    
    @Column
    private Boolean passed = false;
    
    @Column(columnDefinition = "TEXT")
    private String feedback;
    
    @Column(name = "graded_by")
    private UUID gradedBy;
    
    @Column(name = "graded_at")
    private LocalDateTime gradedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // Transient fields for response
    @Transient
    private String studentName;
    
    @Transient
    private String examName;
}
