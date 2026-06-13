package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ChatMessageReaction;
import com.lera.connect_service.repository.ChatMessageReactionRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ChatAuthorizationService;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat/reactions")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ReactionController {

    private final ChatMessageReactionRepository reactionRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatAuthorizationService chatAuth;

    private static final List<String> SUPPORTED_EMOJIS = List.of(
            "👍", "👎", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥", "💯");

    public record AddReactionRequest(
            UUID messageId,
            UUID conversationId,
            String emoji) {}

    public record ReactionSummary(
            String emoji,
            long count,
            List<UUID> userIds,
            boolean currentUserReacted) {}

    private void assertCanAccessMessage(AuthUser authUser, UUID messageId, UUID conversationId) {
        if (conversationId != null) {
            chatAuth.requireParticipantConversation(authUser, conversationId.toString());
            return;
        }
        var message = chatAuth.requireParticipantMessage(authUser, messageId.toString());
        if (!messageId.equals(message.getId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "messageId mismatch");
        }
    }

    @PostMapping
    public ResponseEntity<?> addReaction(
            @Valid @RequestBody AddReactionRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID userId = ConnectSecurity.requireUserId(authUser);
        assertCanAccessMessage(authUser, request.messageId(), request.conversationId());

        if (!SUPPORTED_EMOJIS.contains(request.emoji())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Unsupported emoji. Supported: " + String.join(" ", SUPPORTED_EMOJIS)));
        }

        Optional<ChatMessageReaction> existing = reactionRepository
                .findByMessageIdAndUserIdAndEmoji(request.messageId(), userId, request.emoji());

        String action;
        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
            action = "REMOVED";
        } else {
            ChatMessageReaction reaction = ChatMessageReaction.builder()
                    .messageId(request.messageId())
                    .userId(userId)
                    .emoji(request.emoji())
                    .build();
            reactionRepository.save(reaction);
            action = "ADDED";
        }

        Map<String, Object> update = getReactionUpdate(request.messageId(), userId);
        update.put("action", action);
        update.put("userId", userId);
        update.put("emoji", request.emoji());

        if (request.conversationId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/chat/" + request.conversationId() + "/reactions", update);
        }

        return ResponseEntity.ok(update);
    }

    @GetMapping("/message/{messageId}")
    public ResponseEntity<?> getReactions(
            @PathVariable UUID messageId,
            @RequestParam(required = false) UUID conversationId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID userId = ConnectSecurity.requireUserId(authUser);
        assertCanAccessMessage(authUser, messageId, conversationId);
        return ResponseEntity.ok(getReactionUpdate(messageId, userId));
    }

    @PostMapping("/batch")
    public ResponseEntity<?> getBatchReactions(
            @Valid @RequestBody List<UUID> messageIds,
            @RequestParam(required = false) UUID conversationId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID userId = ConnectSecurity.requireUserId(authUser);
        if (conversationId != null) {
            chatAuth.requireParticipantConversation(authUser, conversationId.toString());
        }
        Map<UUID, Map<String, Object>> results = new HashMap<>();
        for (UUID messageId : messageIds) {
            if (conversationId == null) {
                assertCanAccessMessage(authUser, messageId, null);
            }
            results.put(messageId, getReactionUpdate(messageId, userId));
        }
        return ResponseEntity.ok(results);
    }

    @DeleteMapping("/{messageId}/{emoji}")
    public ResponseEntity<?> removeReaction(
            @PathVariable UUID messageId,
            @PathVariable String emoji,
            @RequestParam(required = false) UUID conversationId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID userId = ConnectSecurity.requireUserId(authUser);
        assertCanAccessMessage(authUser, messageId, conversationId);

        Optional<ChatMessageReaction> existing = reactionRepository
                .findByMessageIdAndUserIdAndEmoji(messageId, userId, emoji);

        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        reactionRepository.delete(existing.get());

        Map<String, Object> update = getReactionUpdate(messageId, userId);
        update.put("action", "REMOVED");
        update.put("userId", userId);
        update.put("emoji", emoji);

        if (conversationId != null) {
            messagingTemplate.convertAndSend(
                    "/topic/chat/" + conversationId + "/reactions", update);
        }

        return ResponseEntity.ok(update);
    }

    @GetMapping("/emojis")
    public ResponseEntity<?> getSupportedEmojis() {
        return ResponseEntity.ok(Map.of(
                "emojis", SUPPORTED_EMOJIS,
                "description", "Supported reaction emojis"));
    }

    private Map<String, Object> getReactionUpdate(UUID messageId, UUID currentUserId) {
        List<ChatMessageReaction> reactions = reactionRepository.findByMessageId(messageId);

        Map<String, List<ChatMessageReaction>> byEmoji = reactions.stream()
                .collect(Collectors.groupingBy(ChatMessageReaction::getEmoji));

        List<ReactionSummary> summaries = byEmoji.entrySet().stream()
                .map(entry -> {
                    List<UUID> userIds = entry.getValue().stream()
                            .map(ChatMessageReaction::getUserId)
                            .collect(Collectors.toList());
                    return new ReactionSummary(
                            entry.getKey(),
                            entry.getValue().size(),
                            userIds,
                            userIds.contains(currentUserId));
                })
                .sorted((a, b) -> Long.compare(b.count(), a.count()))
                .collect(Collectors.toList());

        return Map.of(
                "messageId", messageId,
                "reactions", summaries,
                "totalCount", reactions.size());
    }
}
