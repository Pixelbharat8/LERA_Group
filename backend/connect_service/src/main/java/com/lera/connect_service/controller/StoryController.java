package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Story;
import com.lera.connect_service.entity.StoryView;
import com.lera.connect_service.entity.UserOnlineStatus;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.security.CurrentUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.lera.connect_service.repository.StoryRepository;
import com.lera.connect_service.repository.StoryViewRepository;
import com.lera.connect_service.repository.UserOnlineStatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stories")
@PreAuthorize("isAuthenticated()")
public class StoryController {

    @Autowired
    private StoryRepository storyRepository;

    @Autowired
    private StoryViewRepository storyViewRepository;

    @Autowired
    private UserOnlineStatusRepository userOnlineStatusRepository;

    // =====================================================
    // STORY CRUD OPERATIONS
    // =====================================================

    // Create a new story (staff / teachers only; author = JWT user)
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<?> createStory(@Valid @RequestBody Map<String, Object> request) {
        try {
            UUID userId = CurrentUser.id()
                    .orElse(null);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }
            String contentType = (String) request.getOrDefault("contentType", "image");
            String contentUrl = (String) request.get("contentUrl");
            String textContent = (String) request.get("textContent");
            String backgroundColor = (String) request.getOrDefault("backgroundColor", "#000000");
            String fontStyle = (String) request.getOrDefault("fontStyle", "normal");
            Integer duration = request.get("duration") != null ? 
                Integer.parseInt(request.get("duration").toString()) : 5;
            String musicUrl = (String) request.get("musicUrl");
            String musicTitle = (String) request.get("musicTitle");

            // Stories expire after 24 hours
            LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

            Story story = Story.builder()
                .userId(userId)
                .contentType(contentType)
                .contentUrl(contentUrl)
                .textContent(textContent)
                .backgroundColor(backgroundColor)
                .fontStyle(fontStyle)
                .duration(duration)
                .musicUrl(musicUrl)
                .musicTitle(musicTitle)
                .expiresAt(expiresAt)
                .isActive(true)
                .viewCount(0)
                .build();

            story = storyRepository.save(story);

            return ResponseEntity.ok(Map.of(
                "id", story.getId().toString(),
                "message", "Story created successfully",
                "expiresAt", story.getExpiresAt().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Get all active stories (feed)
    @GetMapping("/feed")
    public ResponseEntity<?> getStoryFeed(
            @RequestParam(required = false) String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID viewerId = ConnectSecurity.requireUserId(authUser);
            if (userId != null && !userId.isBlank()) {
                ConnectSecurity.assertQueryUserIsSelf(authUser, userId);
                viewerId = UUID.fromString(userId.trim());
            }
            LocalDateTime now = LocalDateTime.now();
            List<Story> stories = storyRepository.findAllActiveStories(now);

            // Group stories by user
            Map<String, List<Map<String, Object>>> storyFeed = new LinkedHashMap<>();
            
            for (Story story : stories) {
                String ownerId = story.getUserId().toString();
                storyFeed.computeIfAbsent(ownerId, k -> new ArrayList<>());
                
                Map<String, Object> storyData = new HashMap<>();
                storyData.put("id", story.getId().toString());
                storyData.put("contentType", story.getContentType());
                storyData.put("contentUrl", story.getContentUrl());
                storyData.put("textContent", story.getTextContent());
                storyData.put("backgroundColor", story.getBackgroundColor());
                storyData.put("fontStyle", story.getFontStyle());
                storyData.put("duration", story.getDuration());
                storyData.put("musicUrl", story.getMusicUrl());
                storyData.put("musicTitle", story.getMusicTitle());
                storyData.put("viewCount", story.getViewCount());
                storyData.put("createdAt", story.getCreatedAt().toString());
                storyData.put("expiresAt", story.getExpiresAt().toString());
                
                boolean viewed = storyViewRepository.findByStoryIdAndViewerId(story.getId(), viewerId).isPresent();
                storyData.put("viewed", viewed);
                
                storyFeed.get(ownerId).add(storyData);
            }

            // Convert to list format
            List<Map<String, Object>> result = new ArrayList<>();
            for (Map.Entry<String, List<Map<String, Object>>> entry : storyFeed.entrySet()) {
                Map<String, Object> userStories = new HashMap<>();
                userStories.put("userId", entry.getKey());
                userStories.put("stories", entry.getValue());
                userStories.put("storyCount", entry.getValue().size());
                userStories.put("hasUnviewed", entry.getValue().stream()
                    .anyMatch(s -> !(Boolean) s.getOrDefault("viewed", false)));
                result.add(userStories);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // Get stories by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserStories(
            @PathVariable String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            ConnectSecurity.assertStaffOrSelfUserQuery(authUser, userId);
            UUID uuid = UUID.fromString(userId);
            LocalDateTime now = LocalDateTime.now();
            List<Story> stories = storyRepository.findActiveStoriesByUserId(uuid, now);

            List<Map<String, Object>> result = stories.stream().map(story -> {
                Map<String, Object> storyData = new HashMap<>();
                storyData.put("id", story.getId().toString());
                storyData.put("contentType", story.getContentType());
                storyData.put("contentUrl", story.getContentUrl());
                storyData.put("textContent", story.getTextContent());
                storyData.put("backgroundColor", story.getBackgroundColor());
                storyData.put("fontStyle", story.getFontStyle());
                storyData.put("duration", story.getDuration());
                storyData.put("viewCount", story.getViewCount());
                storyData.put("createdAt", story.getCreatedAt().toString());
                storyData.put("expiresAt", story.getExpiresAt().toString());
                return storyData;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // Get single story
    @GetMapping("/{storyId}")
    public ResponseEntity<?> getStory(@PathVariable String storyId) {
        try {
            UUID uuid = UUID.fromString(storyId);
            Optional<Story> storyOpt = storyRepository.findById(uuid);
            
            if (storyOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Story story = storyOpt.get();
            Map<String, Object> storyData = new HashMap<>();
            storyData.put("id", story.getId().toString());
            storyData.put("userId", story.getUserId().toString());
            storyData.put("contentType", story.getContentType());
            storyData.put("contentUrl", story.getContentUrl());
            storyData.put("textContent", story.getTextContent());
            storyData.put("backgroundColor", story.getBackgroundColor());
            storyData.put("fontStyle", story.getFontStyle());
            storyData.put("duration", story.getDuration());
            storyData.put("musicUrl", story.getMusicUrl());
            storyData.put("musicTitle", story.getMusicTitle());
            storyData.put("viewCount", story.getViewCount());
            storyData.put("createdAt", story.getCreatedAt().toString());
            storyData.put("expiresAt", story.getExpiresAt().toString());
            storyData.put("isActive", story.getIsActive());

            return ResponseEntity.ok(storyData);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    /**
     * Update story content (owner or staff). Refreshes the 24h expiry window.
     */
    @PutMapping("/{storyId}")
    public ResponseEntity<?> updateStory(@PathVariable String storyId, @RequestBody Map<String, Object> request) {
        try {
            UUID uuid = UUID.fromString(storyId);
            Optional<Story> storyOpt = storyRepository.findById(uuid);
            if (storyOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Story story = storyOpt.get();
            if (!CurrentUser.isSelfOrStaff(story.getUserId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }
            if (request.get("contentType") != null) {
                story.setContentType((String) request.get("contentType"));
            }
            if (request.containsKey("contentUrl")) {
                story.setContentUrl((String) request.get("contentUrl"));
            }
            if (request.containsKey("textContent")) {
                story.setTextContent((String) request.get("textContent"));
            }
            if (request.get("backgroundColor") != null) {
                story.setBackgroundColor((String) request.get("backgroundColor"));
            }
            if (request.get("fontStyle") != null) {
                story.setFontStyle((String) request.get("fontStyle"));
            }
            if (request.get("duration") != null) {
                story.setDuration(Integer.parseInt(request.get("duration").toString()));
            }
            if (request.containsKey("musicUrl")) {
                story.setMusicUrl((String) request.get("musicUrl"));
            }
            if (request.containsKey("musicTitle")) {
                story.setMusicTitle((String) request.get("musicTitle"));
            }
            story.setExpiresAt(LocalDateTime.now().plusHours(24));
            story = storyRepository.save(story);

            return ResponseEntity.ok(Map.of(
                    "id", story.getId().toString(),
                    "message", "Story updated",
                    "expiresAt", story.getExpiresAt().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Delete story
    @DeleteMapping("/{storyId}")
    public ResponseEntity<?> deleteStory(@PathVariable String storyId) {
        try {
            UUID uuid = UUID.fromString(storyId);
            Optional<Story> storyOpt = storyRepository.findById(uuid);
            
            if (storyOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Story story = storyOpt.get();
            if (!CurrentUser.isSelfOrStaff(story.getUserId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }
            story.setIsActive(false);
            storyRepository.save(story);

            return ResponseEntity.ok(Map.of("message", "Story deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // =====================================================
    // STORY VIEWS
    // =====================================================

    // View a story (record view)
    @PostMapping("/{storyId}/view")
    public ResponseEntity<?> viewStory(
            @PathVariable String storyId,
            @Valid @RequestBody(required = false) Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID storyUuid = UUID.fromString(storyId);
            UUID viewerId = ConnectSecurity.requireUserId(authUser);
            if (request != null && request.get("viewerId") != null) {
                ConnectSecurity.assertActorIsSelf(authUser, request.get("viewerId").toString());
            }

            // Check if already viewed
            Optional<StoryView> existingView = storyViewRepository.findByStoryIdAndViewerId(storyUuid, viewerId);
            if (existingView.isPresent()) {
                return ResponseEntity.ok(Map.of("message", "Already viewed"));
            }

            // Record view
            StoryView view = StoryView.builder()
                .storyId(storyUuid)
                .viewerId(viewerId)
                .viewedAt(LocalDateTime.now())
                .build();
            storyViewRepository.save(view);

            // Increment view count
            Optional<Story> storyOpt = storyRepository.findById(storyUuid);
            if (storyOpt.isPresent()) {
                Story story = storyOpt.get();
                story.setViewCount(story.getViewCount() + 1);
                storyRepository.save(story);
            }

            return ResponseEntity.ok(Map.of("message", "View recorded"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // React to a story
    @PostMapping("/{storyId}/react")
    public ResponseEntity<?> reactToStory(
            @PathVariable String storyId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID storyUuid = UUID.fromString(storyId);
            String reaction = (String) request.get("reaction");
            if (reaction == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "reaction is required"));
            }
            if (request.get("viewerId") != null) {
                ConnectSecurity.assertActorIsSelf(authUser, request.get("viewerId").toString());
            }
            UUID viewerId = ConnectSecurity.requireUserId(authUser);

            // Find or create view record
            Optional<StoryView> existingView = storyViewRepository.findByStoryIdAndViewerId(storyUuid, viewerId);
            StoryView view;
            if (existingView.isPresent()) {
                view = existingView.get();
                view.setReaction(reaction);
            } else {
                view = StoryView.builder()
                    .storyId(storyUuid)
                    .viewerId(viewerId)
                    .viewedAt(LocalDateTime.now())
                    .reaction(reaction)
                    .build();
            }
            storyViewRepository.save(view);

            return ResponseEntity.ok(Map.of("message", "Reaction added"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Get story viewers
    @GetMapping("/{storyId}/viewers")
    public ResponseEntity<?> getStoryViewers(
            @PathVariable String storyId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID storyUuid = UUID.fromString(storyId);
            Story story = storyRepository.findById(storyUuid)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            if (!CurrentUser.isSelfOrStaff(story.getUserId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }
            List<StoryView> views = storyViewRepository.findByStoryIdOrderByViewedAtDesc(storyUuid);

            List<Map<String, Object>> result = views.stream().map(view -> {
                Map<String, Object> viewData = new HashMap<>();
                viewData.put("viewerId", view.getViewerId().toString());
                viewData.put("viewedAt", view.getViewedAt().toString());
                viewData.put("reaction", view.getReaction());
                return viewData;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "viewers", result,
                "totalViews", result.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("viewers", new ArrayList<>(), "totalViews", 0));
        }
    }

    // =====================================================
    // USER ONLINE STATUS
    // =====================================================

    // Update user online status
    @PostMapping("/status/online")
    public ResponseEntity<?> updateOnlineStatus(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID userId = ConnectSecurity.requireUserId(authUser);
            if (request.get("userId") != null) {
                ConnectSecurity.assertActorIsSelf(authUser, request.get("userId").toString());
            }
            Boolean isOnline = (Boolean) request.getOrDefault("isOnline", true);
            String statusMessage = (String) request.get("statusMessage");
            String deviceType = (String) request.getOrDefault("deviceType", "web");

            Optional<UserOnlineStatus> existingStatus = userOnlineStatusRepository.findByUserId(userId);
            UserOnlineStatus status;
            
            if (existingStatus.isPresent()) {
                status = existingStatus.get();
                status.setIsOnline(isOnline);
                status.setLastSeenAt(LocalDateTime.now());
                status.setUpdatedAt(LocalDateTime.now());
                if (statusMessage != null) status.setStatusMessage(statusMessage);
                if (deviceType != null) status.setDeviceType(deviceType);
            } else {
                status = UserOnlineStatus.builder()
                    .userId(userId)
                    .isOnline(isOnline)
                    .lastSeenAt(LocalDateTime.now())
                    .statusMessage(statusMessage)
                    .deviceType(deviceType)
                    .build();
            }
            
            userOnlineStatusRepository.save(status);

            return ResponseEntity.ok(Map.of(
                "userId", userId.toString(),
                "isOnline", status.getIsOnline(),
                "lastSeenAt", status.getLastSeenAt().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Get user online status
    @GetMapping("/status/{userId}")
    public ResponseEntity<?> getUserOnlineStatus(
            @PathVariable String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID uuid = UUID.fromString(userId);
            UUID self = ConnectSecurity.requireUserId(authUser);
            if (!self.equals(uuid) && !CurrentUser.isStaff()) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }
            Optional<UserOnlineStatus> statusOpt = userOnlineStatusRepository.findByUserId(uuid);

            if (statusOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "userId", userId,
                    "isOnline", false,
                    "lastSeenAt", null
                ));
            }

            UserOnlineStatus status = statusOpt.get();
            return ResponseEntity.ok(Map.of(
                "userId", status.getUserId().toString(),
                "isOnline", status.getIsOnline(),
                "lastSeenAt", status.getLastSeenAt().toString(),
                "statusMessage", status.getStatusMessage() != null ? status.getStatusMessage() : "",
                "deviceType", status.getDeviceType()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "userId", userId,
                "isOnline", false,
                "lastSeenAt", null
            ));
        }
    }

    // Get multiple users online status
    @PostMapping("/status/bulk")
    public ResponseEntity<?> getBulkOnlineStatus(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            @SuppressWarnings("unchecked")
            List<String> userIds = (List<String>) request.get("userIds");
            if (userIds == null || userIds.isEmpty()) {
                return ResponseEntity.ok(new ArrayList<>());
            }
            UUID self = ConnectSecurity.requireUserId(authUser);
            boolean staff = ConnectSecurity.isAcademyStaff(authUser);
            if (!staff) {
                for (String id : userIds) {
                    if (!self.toString().equals(id)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                "Cannot query another user's online status");
                    }
                }
            }

            List<UUID> uuids = userIds.stream()
                .map(UUID::fromString)
                .collect(Collectors.toList());

            List<UserOnlineStatus> statuses = userOnlineStatusRepository.findOnlineUsersFromList(uuids);
            Set<String> onlineUserIds = statuses.stream()
                .map(s -> s.getUserId().toString())
                .collect(Collectors.toSet());

            List<Map<String, Object>> result = userIds.stream().map(userId -> {
                Map<String, Object> data = new HashMap<>();
                data.put("userId", userId);
                data.put("isOnline", onlineUserIds.contains(userId));
                return data;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // Set user offline (for logout/disconnect)
    @PostMapping("/status/offline")
    public ResponseEntity<?> setOffline(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID userId = ConnectSecurity.requireUserId(authUser);
            if (request.get("userId") != null) {
                ConnectSecurity.assertActorIsSelf(authUser, request.get("userId").toString());
            }

            Optional<UserOnlineStatus> statusOpt = userOnlineStatusRepository.findByUserId(userId);
            if (statusOpt.isPresent()) {
                UserOnlineStatus status = statusOpt.get();
                status.setIsOnline(false);
                status.setLastSeenAt(LocalDateTime.now());
                status.setUpdatedAt(LocalDateTime.now());
                userOnlineStatusRepository.save(status);
            }

            return ResponseEntity.ok(Map.of("message", "User set to offline"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }
}
