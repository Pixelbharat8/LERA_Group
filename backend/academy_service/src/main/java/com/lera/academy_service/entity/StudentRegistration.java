package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "student_registrations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentRegistration {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "student_name", nullable = false)
    private String studentName;
    
    @Column(name = "parent_name")
    private String parentName;
    
    @Column(name = "parent_phone", length = 50)
    private String parentPhone;
    
    @Column(name = "parent_email")
    private String parentEmail;
    
    @Column(name = "course_id")
    private UUID courseId;
    
    @Column(name = "course_name")
    private String courseName;
    
    @Column(name = "registration_date")
    @Builder.Default
    private LocalDate registrationDate = LocalDate.now();
    
    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, CONFIRMED, CANCELLED
    
    @Column(name = "payment_status", length = 50)
    @Builder.Default
    private String paymentStatus = "PENDING"; // PENDING, PARTIAL, PAID
    
    @Column(precision = 15, scale = 2)
    @Positive
    private BigDecimal amount;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
