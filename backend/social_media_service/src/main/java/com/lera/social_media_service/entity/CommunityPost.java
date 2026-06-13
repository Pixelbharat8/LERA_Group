package com.lera.social_media_service.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** A community feed post (internal social wall). DB-backed. */
@Entity
@Table(name = "community_posts", indexes = {
        @Index(name = "idx_community_post_center", columnList = "center_id")
})
@Data
public class CommunityPost {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "author_id")
    private UUID authorId;

    @Column(name = "author_name")
    private String authorName;

    @Column(name = "author_avatar")
    private String authorAvatar;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "likes")
    private Integer likes = 0;

    @Column(name = "comments")
    private Integer comments = 0;

    @Column(name = "shares")
    private Integer shares = 0;

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (likes == null) likes = 0;
        if (comments == null) comments = 0;
        if (shares == null) shares = 0;
    }
}
