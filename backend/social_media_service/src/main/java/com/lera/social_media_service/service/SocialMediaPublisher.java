package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.SocialMediaPost;
import com.lera.social_media_service.entity.SocialPlatform;
import com.lera.social_media_service.repository.SocialPlatformRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocialMediaPublisher {
    
    private final SocialPlatformRepository socialPlatformRepository;
    private final FacebookApiClient facebookApiClient;
    private final InstagramApiClient instagramApiClient;
    private final TikTokApiClient tikTokApiClient;
    private final YouTubeApiClient youTubeApiClient;
    
    /**
     * Publish a post to all specified platforms
     */
    public void publishPost(SocialMediaPost post) {
        String[] platforms = post.getPlatforms();
        if (platforms == null || platforms.length == 0) {
            log.warn("No platforms specified for post: {}", post.getId());
            return;
        }
        
        for (String platformName : platforms) {
            try {
                publishToPlatform(post, platformName.toLowerCase());
            } catch (Exception e) {
                log.error("Failed to publish to {}: {}", platformName, e.getMessage());
            }
        }
    }
    
    private void publishToPlatform(SocialMediaPost post, String platformName) {
        SocialPlatform platform = socialPlatformRepository.findByPlatformName(platformName)
                .orElseThrow(() -> new RuntimeException("Platform not found: " + platformName));
        
        if (!platform.getIsConnected()) {
            log.warn("Platform {} is not connected, skipping", platformName);
            return;
        }
        
        if (!platform.getAutoPost()) {
            log.info("Auto-post disabled for {}, skipping", platformName);
            return;
        }
        
        String accessToken = platform.getAccessToken();
        if (accessToken == null || accessToken.isEmpty()) {
            log.error("No access token for platform: {}", platformName);
            return;
        }
        
        Map<String, Object> result;
        
        switch (platformName) {
            case "facebook":
                result = facebookApiClient.publishPost(post, platform);
                if (result != null && result.get("id") != null) {
                    post.setFacebookPostId((String) result.get("id"));
                }
                break;
                
            case "instagram":
                result = instagramApiClient.publishPost(post, platform);
                if (result != null && result.get("id") != null) {
                    post.setInstagramPostId((String) result.get("id"));
                }
                break;
                
            case "tiktok":
                result = tikTokApiClient.publishPost(post, platform);
                if (result != null && result.get("id") != null) {
                    post.setTiktokPostId((String) result.get("id"));
                }
                break;
                
            case "youtube":
                result = youTubeApiClient.publishVideo(post, platform);
                if (result != null && result.get("id") != null) {
                    post.setYoutubeVideoId((String) result.get("id"));
                }
                break;
                
            case "zalo":
                log.info("Zalo posting not yet implemented");
                break;
                
            default:
                log.warn("Unknown platform: {}", platformName);
        }
        
        log.info("Published to {}: {}", platformName, post.getId());
    }
}
