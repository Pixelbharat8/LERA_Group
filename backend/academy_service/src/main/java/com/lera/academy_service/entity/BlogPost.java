package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "blog_posts")
@Data
public class BlogPost {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "title_en", nullable = false)
    private String titleEn;
    
    @Column(name = "title_vi")
    private String titleVi;
    
    @Column(name = "excerpt_en", columnDefinition = "TEXT")
    private String excerptEn;
    
    @Column(name = "excerpt_vi", columnDefinition = "TEXT")
    private String excerptVi;
    
    @Column(name = "content_en", columnDefinition = "TEXT")
    private String contentEn;
    
    @Column(name = "content_vi", columnDefinition = "TEXT")
    private String contentVi;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    @Column(name = "category")
    private String category;

    /**
     * Intended audience for this post. ALL = visible everywhere, PARENT =
     * curated parent resources hub, STUDENT = student tips, TEACHER = staff
     * notes. Defaults to ALL so existing rows behave unchanged.
     */
    @Column(name = "audience")
    private String audience = "ALL";

    @Column(name = "author")
    private String author;
    
    @Column(name = "slug", unique = true)
    private String slug;
    
    @Column(name = "status")
    private String status = "draft"; // published, draft, scheduled
    
    @Column(name = "views")
    private Integer views = 0;
    
    @Column(name = "is_featured")
    private Boolean isFeatured = false;
    
    @Column(name = "published_at")
    private LocalDateTime publishedAt;
    
    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (slug == null && titleEn != null) {
            slug = titleEn.toLowerCase().replaceAll("[^a-z0-9]+", "-");
        }
    }
}
