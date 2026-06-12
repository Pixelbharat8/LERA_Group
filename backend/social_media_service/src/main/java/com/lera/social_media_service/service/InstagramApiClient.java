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
public class InstagramApiClient {
    
    private final RestTemplate restTemplate;
    
    @Value("${instagram.graph.api.url:https://graph.facebook.com/v18.0}")
    private String graphApiUrl;
    
    public InstagramApiClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    /**
     * Publish a single image post to Instagram Business Account
     * Instagram API requires a 2-step process: create container, then publish
     */
    public Map<String, Object> publishPost(SocialMediaPost post, SocialPlatform platform) {
        try {
            String igUserId = platform.getPageId(); // Instagram Business Account ID
            String accessToken = platform.getAccessToken();
            
            if (igUserId == null || accessToken == null) {
                log.error("Missing Instagram user ID or access token");
                return null;
            }
            
            // Step 1: Create media container
            String containerId = createMediaContainer(igUserId, post, accessToken);
            if (containerId == null) {
                return null;
            }
            
            // Step 2: Publish the container
            return publishMediaContainer(igUserId, containerId, accessToken);
            
        } catch (Exception e) {
            log.error("Error posting to Instagram: {}", e.getMessage());
            return null;
        }
    }
    
    private String createMediaContainer(String igUserId, SocialMediaPost post, String accessToken) {
        try {
            String url = graphApiUrl + "/" + igUserId + "/media";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> body = new HashMap<>();
            body.put("image_url", post.getMediaUrl());
            body.put("caption", post.getContent());
            body.put("access_token", accessToken);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("id");
            }
            
            return null;
            
        } catch (Exception e) {
            log.error("Error creating Instagram media container: {}", e.getMessage());
            return null;
        }
    }
    
    private Map<String, Object> publishMediaContainer(String igUserId, String containerId, String accessToken) {
        try {
            String url = graphApiUrl + "/" + igUserId + "/media_publish";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> body = new HashMap<>();
            body.put("creation_id", containerId);
            body.put("access_token", accessToken);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully posted to Instagram, media ID: {}", response.getBody().get("id"));
                return response.getBody();
            }
            
            return null;
            
        } catch (Exception e) {
            log.error("Error publishing Instagram media: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Publish a carousel (multiple images) to Instagram
     */
    public Map<String, Object> publishCarousel(SocialMediaPost post, String[] mediaUrls, SocialPlatform platform) {
        try {
            String igUserId = platform.getPageId();
            String accessToken = platform.getAccessToken();
            
            // Step 1: Create containers for each media item
            String[] containerIds = new String[mediaUrls.length];
            for (int i = 0; i < mediaUrls.length; i++) {
                containerIds[i] = createCarouselItem(igUserId, mediaUrls[i], accessToken);
            }
            
            // Step 2: Create carousel container
            String carouselId = createCarouselContainer(igUserId, containerIds, post.getContent(), accessToken);
            
            // Step 3: Publish
            return publishMediaContainer(igUserId, carouselId, accessToken);
            
        } catch (Exception e) {
            log.error("Error posting carousel to Instagram: {}", e.getMessage());
            return null;
        }
    }
    
    private String createCarouselItem(String igUserId, String mediaUrl, String accessToken) {
        try {
            String url = graphApiUrl + "/" + igUserId + "/media";
            
            Map<String, Object> body = new HashMap<>();
            body.put("image_url", mediaUrl);
            body.put("is_carousel_item", true);
            body.put("access_token", accessToken);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            
            return (String) response.getBody().get("id");
            
        } catch (Exception e) {
            log.error("Error creating carousel item: {}", e.getMessage());
            return null;
        }
    }
    
    private String createCarouselContainer(String igUserId, String[] containerIds, String caption, String accessToken) {
        try {
            String url = graphApiUrl + "/" + igUserId + "/media";
            
            Map<String, Object> body = new HashMap<>();
            body.put("media_type", "CAROUSEL");
            body.put("children", containerIds);
            body.put("caption", caption);
            body.put("access_token", accessToken);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            
            return (String) response.getBody().get("id");
            
        } catch (Exception e) {
            log.error("Error creating carousel container: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Publish a reel (video) to Instagram
     */
    public Map<String, Object> publishReel(SocialMediaPost post, SocialPlatform platform) {
        try {
            String igUserId = platform.getPageId();
            String accessToken = platform.getAccessToken();
            
            // Create video container
            String url = graphApiUrl + "/" + igUserId + "/media";
            
            Map<String, Object> body = new HashMap<>();
            body.put("media_type", "REELS");
            body.put("video_url", post.getMediaUrl());
            body.put("caption", post.getContent());
            body.put("access_token", accessToken);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            
            String containerId = (String) response.getBody().get("id");
            
            // Wait for video processing, then publish
            // In production, you'd poll the container status before publishing
            Thread.sleep(5000); // Simple wait - use proper polling in production
            
            return publishMediaContainer(igUserId, containerId, accessToken);
            
        } catch (Exception e) {
            log.error("Error posting reel to Instagram: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Get Instagram insights
     */
    public Map<String, Object> getInsights(String mediaId, SocialPlatform platform) {
        try {
            String accessToken = platform.getAccessToken();
            String url = graphApiUrl + "/" + mediaId + "/insights"
                    + "?metric=impressions,reach,engagement,saved"
                    + "&access_token=" + accessToken;
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
            
        } catch (Exception e) {
            log.error("Error getting Instagram insights: {}", e.getMessage());
            return null;
        }
    }
}
