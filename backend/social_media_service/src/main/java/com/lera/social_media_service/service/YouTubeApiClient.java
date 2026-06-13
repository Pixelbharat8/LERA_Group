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
public class YouTubeApiClient {
    
    private final RestTemplate restTemplate;
    
    @Value("${youtube.api.url:https://www.googleapis.com/youtube/v3}")
    private String apiUrl;
    
    @Value("${youtube.upload.url:https://www.googleapis.com/upload/youtube/v3}")
    private String uploadUrl;
    
    public YouTubeApiClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    /**
     * Publish a video to YouTube
     */
    public Map<String, Object> publishVideo(SocialMediaPost post, SocialPlatform platform) {
        try {
            String accessToken = platform.getAccessToken();
            
            if (accessToken == null) {
                log.error("Missing YouTube access token");
                return null;
            }
            
            // Create video metadata
            Map<String, Object> snippet = new HashMap<>();
            snippet.put("title", extractTitle(post.getContent()));
            snippet.put("description", post.getContent());
            snippet.put("tags", extractHashtags(post.getContent()));
            snippet.put("categoryId", "22"); // People & Blogs
            
            Map<String, Object> status = new HashMap<>();
            status.put("privacyStatus", "public");
            status.put("selfDeclaredMadeForKids", false);
            
            Map<String, Object> body = new HashMap<>();
            body.put("snippet", snippet);
            body.put("status", status);
            
            // Initialize resumable upload
            String uploadUrl = initializeResumableUpload(body, platform);
            if (uploadUrl == null) {
                return null;
            }
            
            // For URL-based videos, you would download and re-upload
            // This is simplified - in production, use proper resumable upload
            log.info("YouTube upload initialized. Video URL: {}", post.getMediaUrl());
            
            // Return mock response - actual implementation needs video binary upload
            Map<String, Object> result = new HashMap<>();
            result.put("id", "pending_upload");
            result.put("uploadUrl", uploadUrl);
            
            return result;
            
        } catch (Exception e) {
            log.error("Error posting to YouTube: {}", e.getMessage());
            return null;
        }
    }
    
    private String initializeResumableUpload(Map<String, Object> metadata, SocialPlatform platform) {
        try {
            String url = uploadUrl + "/videos?uploadType=resumable&part=snippet,status";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(platform.getAccessToken());
            headers.set("X-Upload-Content-Type", "video/*");
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(metadata, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getHeaders().getFirst("Location");
            }
            
            return null;
            
        } catch (Exception e) {
            log.error("Error initializing YouTube upload: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Get video statistics
     */
    public Map<String, Object> getVideoStats(String videoId, SocialPlatform platform) {
        try {
            String url = apiUrl + "/videos"
                    + "?part=statistics,snippet,contentDetails"
                    + "&id=" + videoId
                    + "&key=" + platform.getApiKey();
            
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
            log.error("Error getting YouTube video stats: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Get channel statistics
     */
    public Map<String, Object> getChannelStats(SocialPlatform platform) {
        try {
            String channelId = platform.getPageId();
            String url = apiUrl + "/channels"
                    + "?part=statistics,snippet,contentDetails"
                    + "&id=" + channelId
                    + "&key=" + platform.getApiKey();
            
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
            log.error("Error getting YouTube channel stats: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Delete a video from YouTube
     */
    public boolean deleteVideo(String videoId, SocialPlatform platform) {
        try {
            String url = apiUrl + "/videos?id=" + videoId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(platform.getAccessToken());
            
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            restTemplate.exchange(url, HttpMethod.DELETE, request, Void.class);
            
            log.info("Deleted YouTube video: {}", videoId);
            return true;
            
        } catch (Exception e) {
            log.error("Error deleting YouTube video: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Update video metadata
     */
    public Map<String, Object> updateVideo(String videoId, String title, String description, SocialPlatform platform) {
        try {
            String url = apiUrl + "/videos?part=snippet";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(platform.getAccessToken());
            
            Map<String, Object> snippet = new HashMap<>();
            snippet.put("title", title);
            snippet.put("description", description);
            snippet.put("categoryId", "22");
            
            Map<String, Object> body = new HashMap<>();
            body.put("id", videoId);
            body.put("snippet", snippet);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    request,
                    Map.class
            );
            
            return response.getBody();
            
        } catch (Exception e) {
            log.error("Error updating YouTube video: {}", e.getMessage());
            return null;
        }
    }
    
    private String extractTitle(String content) {
        if (content == null || content.isEmpty()) {
            return "Untitled Video";
        }
        // Use first line or first 100 chars as title
        String[] lines = content.split("\n");
        String title = lines[0].length() > 100 ? lines[0].substring(0, 97) + "..." : lines[0];
        return title.replaceAll("#\\w+", "").trim(); // Remove hashtags from title
    }
    
    private String[] extractHashtags(String content) {
        if (content == null) {
            return new String[0];
        }
        return java.util.regex.Pattern.compile("#(\\w+)")
                .matcher(content)
                .results()
                .map(m -> m.group(1))
                .toArray(String[]::new);
    }
}
