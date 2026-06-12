package com.lera.social_media_service.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    private Long id;
    private String content;
    private String[] platforms;
    private String mediaUrl;
    private String mediaType;
    private String status;
    private LocalDateTime scheduledAt;
    private LocalDateTime publishedAt;
    private Integer likesCount;
    private Integer commentsCount;
    private Integer sharesCount;
    private Integer viewsCount;
    private Integer reach;
    private Integer impressions;
    private Double engagementRate;
    private String facebookPostId;
    private String instagramPostId;
    private String tiktokPostId;
    private String youtubeVideoId;
    private LocalDateTime createdAt;
}
