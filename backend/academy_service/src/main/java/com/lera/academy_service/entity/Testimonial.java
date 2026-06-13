package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "testimonials")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Testimonial {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "parent_name", nullable = false)
    private String parentName;
    
    @Column(name = "parent_name_vi")
    private String parentNameVi;
    
    @Column(name = "student_name")
    private String studentName;
    
    @Column(name = "student_age")
    private Integer studentAge;
    
    @Column(name = "program_id")
    private UUID programId;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column
    @Builder.Default
    private Integer rating = 5;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "content_vi", columnDefinition = "TEXT")
    private String contentVi;
    
    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;
    
    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;
    
    @Column(name = "is_published")
    @Builder.Default
    private Boolean isPublished = true;
    
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
