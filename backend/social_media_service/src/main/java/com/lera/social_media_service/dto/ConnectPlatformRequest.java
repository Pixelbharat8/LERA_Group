package com.lera.social_media_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectPlatformRequest {
    private String platformName;
    private String accessToken;
    private String refreshToken;
    private String pageId;
    private String accountId;
    private String apiKey;
    private String apiSecret;
    private Boolean autoPost;
    private Boolean autoReply;
}
