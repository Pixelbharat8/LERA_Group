package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "social_media_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialMediaPost {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(length = 500)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "content_type", length = 50)
    @Builder.Default
    private String contentType = "post"; // post, story, reel, video, article

    @Column(name = "media_urls", columnDefinition = "TEXT[]")
    private String[] mediaUrls;

    @Column(columnDefinition = "TEXT[]")
    private String[] platforms; // facebook, instagram, linkedin, twitter, tiktok

    @Column(columnDefinition = "TEXT[]")
    private String[] hashtags;

    @Column(name = "link_url", columnDefinition = "TEXT")
    private String linkUrl;

    @Column(name = "link_preview", columnDefinition = "TEXT")
    private String linkPreview; // JSON

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(length = 50)
    @Builder.Default
    private String status = "draft"; // draft, scheduled, pending_approval, published, failed

    @Column(name = "engagement_data", columnDefinition = "TEXT")
    private String engagementData; // JSON

    @Column
    @Builder.Default
    private Integer reach = 0;

    @Column
    @Builder.Default
    private Integer impressions = 0;

    @Column
    @Builder.Default
    private Integer likes = 0;

    @Column
    @Builder.Default
    private Integer shares = 0;

    @Column
    @Builder.Default
    private Integer comments = 0;

    @Column
    @Builder.Default
    private Integer clicks = 0;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

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
