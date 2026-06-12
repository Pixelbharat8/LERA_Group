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
public class FacebookApiClient {
    
    private final RestTemplate restTemplate;
    
    @Value("${facebook.graph.api.url:https://graph.facebook.com/v18.0}")
    private String graphApiUrl;
    
    public FacebookApiClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    /**
     * Publish a post to Facebook page
     */
    public Map<String, Object> publishPost(SocialMediaPost post, SocialPlatform platform) {
        try {
            String pageId = platform.getPageId();
            String accessToken = platform.getAccessToken();
            
            if (pageId == null || accessToken == null) {
                log.error("Missing Facebook page ID or access token");
                return null;
            }
            
            String url = graphApiUrl + "/" + pageId + "/feed";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> body = new HashMap<>();
            body.put("message", post.getContent());
            body.put("access_token", accessToken);
            
            // Add link if present
            if (post.getMediaUrl() != null && post.getMediaUrl().startsWith("http")) {
                body.put("link", post.getMediaUrl());
            }
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully posted to Facebook, post ID: {}", response.getBody().get("id"));
                return response.getBody();
            }
            
            log.error("Facebook API returned non-success status: {}", response.getStatusCode());
            return null;
            
        } catch (Exception e) {
            log.error("Error posting to Facebook: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Publish a photo to Facebook page
     */
    public Map<String, Object> publishPhoto(SocialMediaPost post, SocialPlatform platform) {
        try {
            String pageId = platform.getPageId();
            String accessToken = platform.getAccessToken();
            
            String url = graphApiUrl + "/" + pageId + "/photos";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> body = new HashMap<>();
            body.put("url", post.getMediaUrl());
            body.put("caption", post.getContent());
            body.put("access_token", accessToken);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    Map.class
            );
            
            return response.getBody();
            
        } catch (Exception e) {
            log.error("Error posting photo to Facebook: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Get page insights/analytics
     */
    public Map<String, Object> getPageInsights(SocialPlatform platform, String period) {
        try {
            String pageId = platform.getPageId();
            String accessToken = platform.getAccessToken();
            
            String url = graphApiUrl + "/" + pageId + "/insights"
                    + "?metric=page_impressions,page_engaged_users,page_fan_adds,page_views_total"
                    + "&period=" + period
                    + "&access_token=" + accessToken;
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            return response.getBody();
            
        } catch (Exception e) {
            log.error("Error getting Facebook insights: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Delete a post from Facebook
     */
    public boolean deletePost(String postId, SocialPlatform platform) {
        try {
            String accessToken = platform.getAccessToken();
            String url = graphApiUrl + "/" + postId + "?access_token=" + accessToken;
            
            restTemplate.delete(url);
            log.info("Deleted Facebook post: {}", postId);
            return true;
            
        } catch (Exception e) {
            log.error("Error deleting Facebook post: {}", e.getMessage());
            return false;
        }
    }
}
