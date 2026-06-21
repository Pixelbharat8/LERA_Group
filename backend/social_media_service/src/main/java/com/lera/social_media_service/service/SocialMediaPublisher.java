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
    
    /** Scheduler entry point — only auto-posts platforms that opted in. */
    public void publishPost(SocialMediaPost post) {
        publishPost(post, false);
    }

    /**
     * Publish a post to all its platforms. Returns a per-platform result map
     * (e.g. {"facebook": "posted: 123_456", "instagram": "skipped: not connected"}).
     * When {@code force} is true (a manual "Publish now"), the per-platform auto-post
     * toggle is ignored — the user explicitly asked to publish.
     */
    public Map<String, String> publishPost(SocialMediaPost post, boolean force) {
        Map<String, String> results = new java.util.LinkedHashMap<>();
        String[] platforms = post.getPlatforms();
        if (platforms == null || platforms.length == 0) {
            results.put("_", "no platforms specified");
            return results;
        }
        for (String platformName : platforms) {
            String key = platformName.toLowerCase();
            try {
                results.put(key, publishToPlatform(post, key, force));
            } catch (Exception e) {
                log.error("Failed to publish to {}: {}", platformName, e.getMessage());
                results.put(key, "error: " + e.getMessage());
            }
        }
        return results;
    }

    private String publishToPlatform(SocialMediaPost post, String platformName, boolean force) {
        SocialPlatform platform = socialPlatformRepository.findByPlatformName(platformName).orElse(null);
        if (platform == null) return "skipped: platform not registered";
        if (!Boolean.TRUE.equals(platform.getIsConnected())) return "skipped: not connected";
        if (!force && !Boolean.TRUE.equals(platform.getAutoPost())) return "skipped: auto-post off";
        String accessToken = platform.getAccessToken();
        if (accessToken == null || accessToken.isEmpty()) return "skipped: no access token";

        Map<String, Object> result;
        switch (platformName) {
            case "facebook":
                result = facebookApiClient.publishPost(post, platform);
                if (result != null && result.get("id") != null) {
                    post.setFacebookPostId((String) result.get("id"));
                    return "posted: " + result.get("id");
                }
                return "error: no post id returned";

            case "instagram":
                result = instagramApiClient.publishPost(post, platform);
                if (result != null && result.get("id") != null) {
                    post.setInstagramPostId((String) result.get("id"));
                    return "posted: " + result.get("id");
                }
                return "error: no post id returned";

            case "tiktok":
                result = tikTokApiClient.publishPost(post, platform);
                if (result != null && result.get("id") != null) {
                    post.setTiktokPostId((String) result.get("id"));
                    return "posted: " + result.get("id");
                }
                return "error: no post id returned";

            case "youtube":
                result = youTubeApiClient.publishVideo(post, platform);
                if (result != null && result.get("id") != null) {
                    post.setYoutubeVideoId((String) result.get("id"));
                    return "posted: " + result.get("id");
                }
                return "error: no video id returned";

            case "zalo":
                return "skipped: Zalo publishing not implemented";

            default:
                return "skipped: " + platformName + " publishing not implemented";
        }
    }
}
