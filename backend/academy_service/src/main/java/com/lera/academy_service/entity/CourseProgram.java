package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "course_programs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseProgram {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(unique = true, nullable = false, length = 50)
    private String code;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "name_vi")
    private String nameVi;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "description_vi", columnDefinition = "TEXT")
    private String descriptionVi;
    
    @Column(name = "age_from")
    private Integer ageFrom;
    
    @Column(name = "age_to")
    private Integer ageTo;
    
    @Column(length = 100)
    private String category;
    
    @Column(length = 50)
    private String level;
    
    @Column(precision = 12, scale = 2)
    @Positive
    private BigDecimal price;
    
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;
    
    @Column(length = 20)
    private String color;
    
    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
    
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
