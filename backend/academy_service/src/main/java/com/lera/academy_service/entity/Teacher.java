package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "teachers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Teacher {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", unique = true)
    private UUID userId;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "teacher_code", unique = true, length = 50)
    private String teacherCode;
    
    private String specialization;
    
    @Column(columnDefinition = "TEXT")
    private String qualification;
    
    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;
    
    @Column(length = 100)
    private String nationality;
    
    @Column(columnDefinition = "TEXT")
    private String bio;
    
    @Column(name = "bio_vi", columnDefinition = "TEXT")
    private String bioVi;
    
    @Column(name = "hourly_rate", precision = 10, scale = 2)
    @Positive
    private BigDecimal hourlyRate;
    
    @Column(name = "contract_type", length = 50)
    private String contractType;
    
    @Column(name = "is_native_speaker")
    @Builder.Default
    private Boolean isNativeSpeaker = false;
    
    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;
    
    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
