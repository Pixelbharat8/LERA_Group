package com.lera.connect_service.controller;

import com.lera.connect_service.entity.UserConversationPrefs;
import com.lera.connect_service.repository.UserConversationPrefsRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ChatAuthorizationService;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/chat/conversations")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class ConversationPrefsController {

    private final UserConversationPrefsRepository prefsRepository;
    private final ChatAuthorizationService chatAuth;

    @GetMapping("/{conversationId}/prefs")
    public ResponseEntity<?> getPrefs(
            @PathVariable String conversationId,
            @RequestParam String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertQueryUserIsSelf(authUser, userId);
        chatAuth.requireParticipantConversation(authUser, conversationId);
        UUID userUuid = ConnectSecurity.parseUuid(userId, "userId");
        UUID convUuid = ConnectSecurity.parseUuid(conversationId, "conversationId");

        Optional<UserConversationPrefs> prefsOpt = prefsRepository.findByUserIdAndConversationId(userUuid, convUuid);
        if (prefsOpt.isPresent()) {
            UserConversationPrefs prefs = prefsOpt.get();
            return ResponseEntity.ok(Map.of(
                    "conversationId", conversationId,
                    "isArchived", prefs.getIsArchived(),
                    "isMuted", prefs.getIsMuted(),
                    "isPinned", prefs.getIsPinned(),
                    "pinOrder", prefs.getPinOrder(),
                    "mutedUntil", prefs.getMutedUntil() != null ? prefs.getMutedUntil().toString() : null));
        }
        return ResponseEntity.ok(Map.of(
                "conversationId", conversationId,
                "isArchived", false,
                "isMuted", false,
                "isPinned", false,
                "pinOrder", 0,
                "mutedUntil", null));
    }

    @PutMapping("/{conversationId}/archive")
    public ResponseEntity<?> archiveConversation(
            @PathVariable String conversationId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        String userId = (String) request.get("userId");
        ConnectSecurity.assertQueryUserIsSelf(authUser, userId);
        chatAuth.requireParticipantConversation(authUser, conversationId);
        Boolean archive = (Boolean) request.getOrDefault("archive", true);

        UUID userUuid = ConnectSecurity.parseUuid(userId, "userId");
        UUID convUuid = ConnectSecurity.parseUuid(conversationId, "conversationId");

        UserConversationPrefs prefs = getOrCreatePrefs(userUuid, convUuid);
        prefs.setIsArchived(archive);
        prefs.setUpdatedAt(LocalDateTime.now());
        prefsRepository.save(prefs);

        return ResponseEntity.ok(Map.of(
                "message", archive ? "Conversation archived" : "Conversation unarchived",
                "conversationId", conversationId,
                "isArchived", archive));
    }

    @PutMapping("/{conversationId}/mute")
    public ResponseEntity<?> muteConversation(
            @PathVariable String conversationId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        String userId = (String) request.get("userId");
        ConnectSecurity.assertQueryUserIsSelf(authUser, userId);
        chatAuth.requireParticipantConversation(authUser, conversationId);
        Boolean mute = (Boolean) request.getOrDefault("mute", true);
        Integer durationHours = (Integer) request.get("durationHours");

        UUID userUuid = ConnectSecurity.parseUuid(userId, "userId");
        UUID convUuid = ConnectSecurity.parseUuid(conversationId, "conversationId");

        UserConversationPrefs prefs = getOrCreatePrefs(userUuid, convUuid);
        prefs.setIsMuted(mute);
        if (mute && durationHours != null) {
            prefs.setMutedUntil(LocalDateTime.now().plusHours(durationHours));
        } else if (!mute) {
            prefs.setMutedUntil(null);
        }
        prefs.setUpdatedAt(LocalDateTime.now());
        prefsRepository.save(prefs);

        String message = mute
                ? (durationHours != null ? "Conversation muted for " + durationHours + " hours" : "Conversation muted")
                : "Conversation unmuted";

        return ResponseEntity.ok(Map.of(
                "message", message,
                "conversationId", conversationId,
                "isMuted", mute,
                "mutedUntil", prefs.getMutedUntil() != null ? prefs.getMutedUntil().toString() : null));
    }

    @PutMapping("/{conversationId}/pin")
    public ResponseEntity<?> pinConversation(
            @PathVariable String conversationId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        String userId = (String) request.get("userId");
        ConnectSecurity.assertQueryUserIsSelf(authUser, userId);
        chatAuth.requireParticipantConversation(authUser, conversationId);
        Boolean pin = (Boolean) request.getOrDefault("pin", true);

        UUID userUuid = ConnectSecurity.parseUuid(userId, "userId");
        UUID convUuid = ConnectSecurity.parseUuid(conversationId, "conversationId");

        UserConversationPrefs prefs = getOrCreatePrefs(userUuid, convUuid);
        prefs.setIsPinned(pin);
        if (pin) {
            int maxOrder = prefsRepository.findMaxPinOrder(userUuid);
            prefs.setPinOrder(maxOrder + 1);
        } else {
            prefs.setPinOrder(0);
        }
        prefs.setUpdatedAt(LocalDateTime.now());
        prefsRepository.save(prefs);

        return ResponseEntity.ok(Map.of(
                "message", pin ? "Conversation pinned" : "Conversation unpinned",
                "conversationId", conversationId,
                "isPinned", pin,
                "pinOrder", prefs.getPinOrder()));
    }

    @GetMapping("/prefs/all")
    public ResponseEntity<?> getAllPrefs(
            @RequestParam String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertQueryUserIsSelf(authUser, userId);
        UUID userUuid = ConnectSecurity.parseUuid(userId, "userId");
        List<UserConversationPrefs> allPrefs = prefsRepository.findByUserId(userUuid);

        List<Map<String, Object>> result = new ArrayList<>();
        for (UserConversationPrefs prefs : allPrefs) {
            Map<String, Object> item = new HashMap<>();
            item.put("conversationId", prefs.getConversationId().toString());
            item.put("isArchived", prefs.getIsArchived());
            item.put("isMuted", prefs.getIsMuted());
            item.put("isPinned", prefs.getIsPinned());
            item.put("pinOrder", prefs.getPinOrder());
            item.put("mutedUntil", prefs.getMutedUntil() != null ? prefs.getMutedUntil().toString() : null);
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/archived")
    public ResponseEntity<?> getArchivedConversations(
            @RequestParam String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertQueryUserIsSelf(authUser, userId);
        UUID userUuid = ConnectSecurity.parseUuid(userId, "userId");
        List<UserConversationPrefs> archived = prefsRepository.findArchivedConversations(userUuid);

        List<String> conversationIds = new ArrayList<>();
        for (UserConversationPrefs prefs : archived) {
            conversationIds.add(prefs.getConversationId().toString());
        }
        return ResponseEntity.ok(Map.of(
                "archivedConversationIds", conversationIds,
                "count", conversationIds.size()));
    }

    @GetMapping("/pinned")
    public ResponseEntity<?> getPinnedConversations(
            @RequestParam String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertQueryUserIsSelf(authUser, userId);
        UUID userUuid = ConnectSecurity.parseUuid(userId, "userId");
        List<UserConversationPrefs> pinned = prefsRepository.findPinnedConversations(userUuid);

        List<Map<String, Object>> result = new ArrayList<>();
        for (UserConversationPrefs prefs : pinned) {
            result.add(Map.of(
                    "conversationId", prefs.getConversationId().toString(),
                    "pinOrder", prefs.getPinOrder()));
        }
        return ResponseEntity.ok(Map.of(
                "pinnedConversations", result,
                "count", result.size()));
    }

    private UserConversationPrefs getOrCreatePrefs(UUID userId, UUID conversationId) {
        return prefsRepository.findByUserIdAndConversationId(userId, conversationId)
                .orElseGet(() -> UserConversationPrefs.builder()
                        .userId(userId)
                        .conversationId(conversationId)
                        .isArchived(false)
                        .isMuted(false)
                        .isPinned(false)
                        .pinOrder(0)
                        .createdAt(LocalDateTime.now())
                        .build());
    }
}
