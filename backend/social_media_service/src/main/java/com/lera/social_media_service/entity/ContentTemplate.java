package com.lera.social_media_service.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "content_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "template_type", length = 50)
    @Builder.Default
    private String templateType = "POST"; // POST, STORY, REEL, AD, EMAIL
    
    @Column(name = "content_template", columnDefinition = "TEXT", nullable = false)
    private String contentTemplate;
    
    @Column(name = "media_urls", columnDefinition = "TEXT[]")
    private String[] mediaUrls;
    
    @Column(columnDefinition = "TEXT[]")
    private String[] hashtags;
    
    @Column(columnDefinition = "TEXT[]")
    private String[] platforms;
    
    @Column(length = 50)
    private String category; // PROMOTION, ANNOUNCEMENT, STUDENT_SUCCESS, TIPS, EVENT
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "use_count")
    @Builder.Default
    private Integer useCount = 0;
    
    @Column(name = "created_by")
    private UUID createdBy;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
