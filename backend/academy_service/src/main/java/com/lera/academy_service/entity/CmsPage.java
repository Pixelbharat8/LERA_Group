package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cms_pages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CmsPage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String slug;

    @Column(name = "title_en")
    private String titleEn;

    @Column(name = "title_vi")
    private String titleVi;

    @Column(name = "content_en", columnDefinition = "TEXT")
    private String contentEn;

    @Column(name = "content_vi", columnDefinition = "TEXT")
    private String contentVi;

    @Column(name = "meta_title")
    private String metaTitle;

    @Column(name = "meta_description", length = 500)
    private String metaDescription;

    @Column(name = "featured_image", columnDefinition = "TEXT")
    private String featuredImage;

    @Column(name = "is_published")
    private Boolean isPublished = false;

    @Column(name = "publish_date")
    private LocalDateTime publishDate;

    @Column(name = "author_id")
    private UUID authorId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
