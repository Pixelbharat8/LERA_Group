package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "curriculum")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Curriculum {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "name_vi")
    private String nameVi;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "description_vi", columnDefinition = "TEXT")
    private String descriptionVi;
    
    @Column(name = "course_id")
    private UUID courseId;
    
    @Column(name = "grade_level")
    private String gradeLevel;
    
    private String version;
    
    @Column(name = "is_active")
    private Boolean isActive;
    
    @Column(name = "total_hours")
    private Integer totalHours;
    
    @Column(name = "total_weeks")
    private Integer totalWeeks;
    
    @Column(name = "lessons_per_week")
    private Integer lessonsPerWeek;
    
    @Column(name = "assessment_strategy", columnDefinition = "TEXT")
    private String assessmentStrategy;
    
    @Column(name = "assessment_strategy_vi", columnDefinition = "TEXT")
    private String assessmentStrategyVi;
    
    @Column(name = "homework_policy", columnDefinition = "TEXT")
    private String homeworkPolicy;
    
    @Column(name = "homework_policy_vi", columnDefinition = "TEXT")
    private String homeworkPolicyVi;
    
    @Column(name = "textbook_name")
    private String textbookName;
    
    @Column(name = "textbook_isbn")
    private String textbookIsbn;
    
    @Column(name = "supplementary_materials", columnDefinition = "TEXT")
    private String supplementaryMaterials;
    
    @Column(name = "center_id")
    private UUID centerId;
    
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
        if (isActive == null) isActive = true;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
