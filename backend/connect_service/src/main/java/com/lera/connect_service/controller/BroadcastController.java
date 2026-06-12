package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Notification;
import com.lera.connect_service.repository.NotificationRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/broadcasts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
public class BroadcastController {

    private final NotificationRepository notificationRepository;

    private List<Notification> scopedBroadcasts(AuthUser authUser, UUID requestedCenterId) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, requestedCenterId);
        List<Notification> broadcasts = notificationRepository.findByUserIdIsNullOrderByCreatedAtDesc();
        if (eff != null) {
            return broadcasts.stream().filter(b -> eff.equals(b.getCenterId())).toList();
        }
        if (ConnectSecurity.isOrgWide(authUser)) {
            return broadcasts;
        }
        UUID jwtCenter = authUser.getCenterId();
        if (jwtCenter == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "centerId is required for broadcast list queries unless you have an org-wide role");
        }
        return broadcasts.stream().filter(b -> jwtCenter.equals(b.getCenterId())).toList();
    }

    private Map<String, Object> toResponse(Notification b) {
        Map<String, Object> broadcast = new HashMap<>();
        broadcast.put("id", b.getId());
        broadcast.put("subject", b.getTitle());
        broadcast.put("title", b.getTitle());
        broadcast.put("message", b.getMessage());
        broadcast.put("content", b.getMessage());
        broadcast.put("type", b.getType() != null ? b.getType() : "ALL_PARENTS");
        broadcast.put("broadcastType", b.getType() != null ? b.getType() : "ALL_PARENTS");
        broadcast.put("recipientCount", 0);
        broadcast.put("sentBy", "Admin");
        broadcast.put("senderName", "Admin");
        broadcast.put("sentAt", b.getCreatedAt());
        broadcast.put("createdAt", b.getCreatedAt());
        broadcast.put("status", b.getIsRead() != null && b.getIsRead() ? "READ" : "SENT");
        broadcast.put("centerId", b.getCenterId());
        return broadcast;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllBroadcasts(
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        List<Map<String, Object>> response = scopedBroadcasts(authUser, centerId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBroadcastById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return notificationRepository.findById(id)
                .map(b -> {
                    ConnectSecurity.assertCanAccessNotification(authUser, b);
                    return ResponseEntity.ok(toResponse(b));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBroadcast(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        String subject = (String) request.getOrDefault("subject", request.get("title"));
        String message = (String) request.getOrDefault("message", request.get("content"));
        String type = (String) request.getOrDefault("type", "ALL_PARENTS");
        UUID centerId = null;
        if (request.get("centerId") != null) {
            centerId = UUID.fromString(request.get("centerId").toString());
        }
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        if (!ConnectSecurity.isOrgWide(authUser)) {
            if (eff == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "centerId is required");
            }
            centerId = eff;
        }

        Notification broadcast = new Notification();
        broadcast.setUserId(null);
        broadcast.setTitle(subject);
        broadcast.setMessage(message);
        broadcast.setType(type);
        broadcast.setCenterId(centerId);
        broadcast.setIsRead(false);
        broadcast.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(broadcast);
        return ResponseEntity.ok(toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBroadcast(
            @PathVariable UUID id,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        return notificationRepository.findById(id)
                .map(broadcast -> {
                    ConnectSecurity.assertCanAccessNotification(authUser, broadcast);
                    if (request.containsKey("subject") || request.containsKey("title")) {
                        broadcast.setTitle((String) request.getOrDefault("subject", request.get("title")));
                    }
                    if (request.containsKey("message") || request.containsKey("content")) {
                        broadcast.setMessage((String) request.getOrDefault("message", request.get("content")));
                    }
                    if (request.containsKey("type")) {
                        broadcast.setType((String) request.get("type"));
                    }
                    Notification saved = notificationRepository.save(broadcast);
                    return ResponseEntity.ok(toResponse(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBroadcast(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return notificationRepository.findById(id)
                .map(b -> {
                    ConnectSecurity.assertCanAccessNotification(authUser, b);
                    notificationRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Map<String, Object>>> getBroadcastsByType(
            @PathVariable String type,
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        List<Map<String, Object>> response = scopedBroadcasts(authUser, centerId).stream()
                .filter(b -> type.equalsIgnoreCase(b.getType()))
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentBroadcasts(
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Map<String, Object>> response = scopedBroadcasts(authUser, centerId).stream()
                .filter(b -> b.getCreatedAt() != null && b.getCreatedAt().isAfter(thirtyDaysAgo))
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(response);
    }
}
