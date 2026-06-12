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
public class CreatePostRequest {
    private String content;
    private String[] platforms;
    private String mediaUrl;
    private String mediaType;
    private String[] hashtags;
    private LocalDateTime scheduledAt;
    private Long campaignId;
    private Boolean autoPublish;
}
