package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Notification;
import com.lera.connect_service.repository.NotificationRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

/**
 * MessageController - provides messaging functionality for dashboards
 * Uses notifications as the underlying storage for messages
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class MessageController {
    
    private final NotificationRepository notificationRepository;
    
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMessages(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean unread,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID effectiveUserId = ConnectSecurity.effectiveNotificationUserId(authUser, userId);

        List<Notification> notifications;
        if (Boolean.TRUE.equals(unread)) {
            notifications = notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(effectiveUserId, false);
        } else {
            notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(effectiveUserId);
        }
        if (role != null && !role.isBlank()) {
            String roleUpper = role.toUpperCase();
            notifications = notifications.stream()
                    .filter(n -> n.getType() != null && n.getType().toUpperCase().contains(roleUpper))
                    .toList();
        }
        
        List<Map<String, Object>> messages = new ArrayList<>();
        for (Notification n : notifications) {
            Map<String, Object> msg = new HashMap<>();
            msg.put("id", n.getId());
            msg.put("userId", n.getUserId());
            msg.put("title", n.getTitle());
            msg.put("message", n.getMessage());
            msg.put("content", n.getMessage());
            msg.put("type", n.getType());
            msg.put("isRead", n.getIsRead());
            msg.put("read", n.getIsRead());
            msg.put("readAt", n.getReadAt());
            msg.put("createdAt", n.getCreatedAt());
            msg.put("date", n.getCreatedAt());
            msg.put("referenceType", n.getReferenceType());
            msg.put("referenceId", n.getReferenceId());
            messages.add(msg);
        }
        
        return ResponseEntity.ok(messages);
    }
    
    @GetMapping("/unread")
    public ResponseEntity<List<Map<String, Object>>> getUnreadMessages(
            @RequestParam(required = false) UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID effectiveUserId = ConnectSecurity.effectiveNotificationUserId(authUser, userId);

        List<Notification> notifications = notificationRepository
                .findByUserIdAndIsReadOrderByCreatedAtDesc(effectiveUserId, false);
        
        List<Map<String, Object>> messages = new ArrayList<>();
        for (Notification n : notifications) {
            Map<String, Object> msg = new HashMap<>();
            msg.put("id", n.getId());
            msg.put("userId", n.getUserId());
            msg.put("title", n.getTitle());
            msg.put("message", n.getMessage());
            msg.put("content", n.getMessage());
            msg.put("type", n.getType());
            msg.put("isRead", n.getIsRead());
            msg.put("createdAt", n.getCreatedAt());
            msg.put("date", n.getCreatedAt());
            messages.add(msg);
        }
        
        return ResponseEntity.ok(messages);
    }
    
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @RequestParam(required = false) UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID effectiveUserId = ConnectSecurity.effectiveNotificationUserId(authUser, userId);
        long count = notificationRepository.countByUserIdAndIsRead(effectiveUserId, false);
        
        Map<String, Object> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getMessageById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return notificationRepository.findById(id)
                .map(n -> {
                    ConnectSecurity.assertCanAccessNotification(authUser, n);
                    Map<String, Object> msg = new HashMap<>();
                    msg.put("id", n.getId());
                    msg.put("userId", n.getUserId());
                    msg.put("title", n.getTitle());
                    msg.put("message", n.getMessage());
                    msg.put("content", n.getMessage());
                    msg.put("type", n.getType());
                    msg.put("isRead", n.getIsRead());
                    msg.put("readAt", n.getReadAt());
                    msg.put("createdAt", n.getCreatedAt());
                    return ResponseEntity.ok(msg);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return notificationRepository.findById(id)
                .map(n -> {
                    ConnectSecurity.assertCanAccessNotification(authUser, n);
                    n.setIsRead(true);
                    n.setReadAt(LocalDateTime.now());
                    notificationRepository.save(n);
                    
                    Map<String, Object> msg = new HashMap<>();
                    msg.put("id", n.getId());
                    msg.put("isRead", true);
                    msg.put("readAt", n.getReadAt());
                    msg.put("message", "Marked as read");
                    return ResponseEntity.ok(msg);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Mark message as read - PATCH method
     * Frontend calls: PATCH /api/messages/{id}/read
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsReadPatch(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return markAsRead(id, authUser);
    }

    /**
     * Star/unstar a message
     * Frontend calls: PATCH /api/messages/{id}/star
     */
    @PatchMapping("/{id}/star")
    public ResponseEntity<Map<String, Object>> toggleStar(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return notificationRepository.findById(id)
                .map(n -> {
                    ConnectSecurity.assertCanAccessNotification(authUser, n);
                    // Toggle star status (using type field or a dedicated field)
                    boolean isStarred = "STARRED".equals(n.getType()) || 
                                       (n.getType() != null && n.getType().contains("STARRED"));
                    if (isStarred) {
                        n.setType(n.getType().replace("STARRED", "MESSAGE"));
                    } else {
                        n.setType("STARRED");
                    }
                    notificationRepository.save(n);
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("id", n.getId());
                    response.put("starred", !isStarred);
                    response.put("message", isStarred ? "Unstarred" : "Starred");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createMessage(
            @Valid @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal AuthUser authUser) {
        Notification notification = new Notification();

        UUID recipientId = null;
        if (body.get("userId") != null) {
            recipientId = UUID.fromString(body.get("userId").toString());
        }
        UUID effectiveRecipient = ConnectSecurity.effectiveNotificationUserId(authUser, recipientId);
        notification.setUserId(effectiveRecipient);
        notification.setTitle((String) body.getOrDefault("title", "New Message"));
        notification.setMessage((String) body.getOrDefault("message", 
                                (String) body.getOrDefault("content", "")));
        notification.setType((String) body.getOrDefault("type", "MESSAGE"));
        notification.setIsRead(false);
        
        Notification saved = notificationRepository.save(notification);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", saved.getId());
        response.put("userId", saved.getUserId());
        response.put("title", saved.getTitle());
        response.put("message", saved.getMessage());
        response.put("type", saved.getType());
        response.put("createdAt", saved.getCreatedAt());
        
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return notificationRepository.findById(id)
                .map(n -> {
                    ConnectSecurity.assertCanAccessNotification(authUser, n);
                    notificationRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
