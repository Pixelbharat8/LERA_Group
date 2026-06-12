package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.SocialMediaPost;
import com.lera.social_media_service.entity.SocialPlatform;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class TikTokApiClient {
    
    private final RestTemplate restTemplate;
    
    @Value("${tiktok.api.url:https://open.tiktokapis.com/v2}")
    private String apiUrl;
    
    public TikTokApiClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    /**
     * Publish a video to TikTok
     * TikTok requires uploading video first, then creating post
     */
    public Map<String, Object> publishPost(SocialMediaPost post, SocialPlatform platform) {
        try {
            String accessToken = platform.getAccessToken();
            
            if (accessToken == null) {
                log.error("Missing TikTok access token");
                return null;
            }
            
            // Step 1: Initialize video upload
            Map<String, Object> uploadInfo = initializeVideoUpload(post, platform);
            if (uploadInfo == null) {
                return null;
            }
            
            String publishId = (String) uploadInfo.get("publish_id");
            
            // Step 2: Upload video chunks (simplified - in production, use chunked upload)
            boolean uploaded = uploadVideoFromUrl(post.getMediaUrl(), uploadInfo, platform);
            if (!uploaded) {
                return null;
            }
            
            // Step 3: Create the post
            return createPost(publishId, post, platform);
            
        } catch (Exception e) {
            log.error("Error posting to TikTok: {}", e.getMessage());
            return null;
        }
    }
    
    private Map<String, Object> initializeVideoUpload(SocialMediaPost post, SocialPlatform platform) {
        try {
            String url = apiUrl + "/post/publish/video/init/";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(platform.getAccessToken());
            
            Map<String, Object> postInfo = new HashMap<>();
            postInfo.put("title", post.getContent().length() > 150 ? 
                    post.getContent().substring(0, 147) + "..." : post.getContent());
            postInfo.put("privacy_level", "PUBLIC_TO_EVERYONE");
            postInfo.put("disable_duet", false);
            postInfo.put("disable_comment", false);
            postInfo.put("disable_stitch", false);
            
            Map<String, Object> sourceInfo = new HashMap<>();
            sourceInfo.put("source", "PULL_FROM_URL");
            sourceInfo.put("video_url", post.getMediaUrl());
            
            Map<String, Object> body = new HashMap<>();
            body.put("post_info", postInfo);
            body.put("source_info", sourceInfo);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                return data;
            }
            
            return null;
            
        } catch (Exception e) {
            log.error("Error initializing TikTok upload: {}", e.getMessage());
            return null;
        }
    }
    
    private boolean uploadVideoFromUrl(String videoUrl, Map<String, Object> uploadInfo, SocialPlatform platform) {
        // TikTok PULL_FROM_URL method handles this automatically
        // For direct upload, you would upload chunks to the upload_url
        return true;
    }
    
    private Map<String, Object> createPost(String publishId, SocialMediaPost post, SocialPlatform platform) {
        try {
            String url = apiUrl + "/post/publish/status/fetch/";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(platform.getAccessToken());
            
            Map<String, Object> body = new HashMap<>();
            body.put("publish_id", publishId);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            // Poll for publish status
            for (int i = 0; i < 30; i++) { // Max 30 attempts
                ResponseEntity<Map> response = restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        request,
                        Map.class
                );
                
                if (response.getBody() != null) {
                    Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                    String status = (String) data.get("status");
                    
                    if ("PUBLISH_COMPLETE".equals(status)) {
                        log.info("Successfully posted to TikTok");
                        return data;
                    } else if ("FAILED".equals(status)) {
                        log.error("TikTok publish failed");
                        return null;
                    }
                }
                
                Thread.sleep(2000); // Wait 2 seconds before polling again
            }
            
            log.error("TikTok publish timed out");
            return null;
            
        } catch (Exception e) {
            log.error("Error creating TikTok post: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Get video insights from TikTok
     */
    public Map<String, Object> getVideoInsights(String videoId, SocialPlatform platform) {
        try {
            String url = apiUrl + "/video/query/"
                    + "?fields=id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,"
                    + "embed_link,embed_html,like_count,comment_count,share_count,view_count";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(platform.getAccessToken());
            
            Map<String, Object> body = new HashMap<>();
            Map<String, Object> filters = new HashMap<>();
            filters.put("video_ids", new String[]{videoId});
            body.put("filters", filters);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    Map.class
            );
            
            return response.getBody();
            
        } catch (Exception e) {
            log.error("Error getting TikTok insights: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Get user profile info
     */
    public Map<String, Object> getUserProfile(SocialPlatform platform) {
        try {
            String url = apiUrl + "/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(platform.getAccessToken());
            
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    request,
                    Map.class
            );
            
            return response.getBody();
            
        } catch (Exception e) {
            log.error("Error getting TikTok user profile: {}", e.getMessage());
            return null;
        }
    }
}
