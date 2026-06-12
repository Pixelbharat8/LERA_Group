package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ChatMessage;
import com.lera.connect_service.entity.Conversation;
import com.lera.connect_service.repository.ChatMessageRepository;
import com.lera.connect_service.repository.ConversationRepository;
import com.lera.connect_service.service.ChatRealtimePublisher;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ChatAuthorizationService;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/chat")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final ConversationRepository conversationRepository;
    private final ChatAuthorizationService chatAuth;
    private final ChatRealtimePublisher chatRealtimePublisher;
    private final RestTemplate restTemplate;

    @Value("${identity.service.url:http://localhost:8081}")
    private String identityServiceUrl;

    // Cache for user names
    private static final Map<String, String> userNameCache = new ConcurrentHashMap<>();

    // Fetch user name from Identity Service
    private String getUserName(String userId) {
        if (userId == null || userId.isEmpty()) return "Unknown User";

        // Check cache first
        if (userNameCache.containsKey(userId)) {
            return userNameCache.get(userId);
        }

        try {
            String url = identityServiceUrl + "/api/users/" + userId;
            @SuppressWarnings("unchecked")
            Map<String, Object> user = restTemplate.getForObject(url, Map.class);
            if (user != null) {
                String fullname = (String) user.get("fullname");
                String name = (String) user.get("name");
                String email = (String) user.get("email");
                String roleName = (String) user.get("roleName");

                String displayName = fullname != null && !fullname.isEmpty() ? fullname :
                                    name != null && !name.isEmpty() ? name :
                                    email != null ? email.split("@")[0] : "User";

                // Add role to name for clarity
                if (roleName != null && !roleName.isEmpty()) {
                    displayName = displayName + " (" + roleName + ")";
                }

                userNameCache.put(userId, displayName);
                return displayName;
            }
        } catch (Exception e) {
            // Failed to fetch user, use fallback
        }

        return "User " + userId.substring(0, Math.min(8, userId.length()));
    }

    private Map<String, Object> toConversationSummary(Conversation conv, String userId) {
        List<ChatMessage> messages = chatMessageRepository.findByLeadIdOrderBySentAtAsc(conv.getId());
        messages = messages.stream()
                .filter(m -> m.getDeletedAt() == null)
                .collect(Collectors.toList());
        messages.sort((a, b) -> {
            if (b.getSentAt() == null) return -1;
            if (a.getSentAt() == null) return 1;
            return b.getSentAt().compareTo(a.getSentAt());
        });

        ChatMessage lastMsg = messages.isEmpty() ? null : messages.get(0);
        long unreadCount = messages.stream()
                .filter(m -> m.getIsRead() == null || !m.getIsRead())
                .filter(m -> m.getSenderId() != null && !m.getSenderId().toString().equals(userId))
                .count();

        String displayName = "Conversation";
        List<UUID> participantIds = conv.getParticipantIds();
        for (UUID participantId : participantIds) {
            if (!participantId.toString().equals(userId)) {
                displayName = getUserName(participantId.toString());
                break;
            }
        }

        String lastMessagePreview = "";
        if (lastMsg != null) {
            boolean isMine = lastMsg.getSenderId() != null && lastMsg.getSenderId().toString().equals(userId);
            String senderPrefix = isMine ? "You" : displayName.split(" \\(")[0];
            lastMessagePreview = senderPrefix + ": " + (lastMsg.getMessage() != null ? lastMsg.getMessage() : "");
        }

        String avatarInitial = displayName.length() > 0 ? String.valueOf(displayName.charAt(0)).toUpperCase() : "?";

        Map<String, Object> convMap = new HashMap<>();
        convMap.put("id", conv.getId().toString());
        convMap.put("name", displayName);
        convMap.put("avatarInitial", avatarInitial);
        convMap.put("lastMessage", lastMessagePreview);
        convMap.put("lastMessageTime", lastMsg != null && lastMsg.getSentAt() != null ? lastMsg.getSentAt().toString() : "");
        convMap.put("unreadCount", (int) unreadCount);
        convMap.put("isOnline", true);
        convMap.put("type", conv.getConversationType() != null ? conv.getConversationType() : "DIRECT");
        convMap.put("participantIds", participantIds.stream().map(UUID::toString).collect(Collectors.toList()));
        return convMap;
    }

    // Get all conversations for a user - only returns conversations where user is a participant
    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(
            @RequestParam(required = false) String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID userUUID = chatAuth.effectiveUserId(authUser, userId);
            String userIdStr = userUUID.toString();
            List<Map<String, Object>> conversations = new ArrayList<>();
            for (Conversation conv : conversationRepository.findByParticipantId(userUUID)) {
                if (conv.getIsActive() == null || conv.getIsActive()) {
                    conversations.add(toConversationSummary(conv, userIdStr));
                }
            }
            conversations.sort((a, b) -> {
                String timeA = (String) a.get("lastMessageTime");
                String timeB = (String) b.get("lastMessageTime");
                if (timeB == null || timeB.isEmpty()) return -1;
                if (timeA == null || timeA.isEmpty()) return 1;
                return timeB.compareTo(timeA);
            });
            return ResponseEntity.ok(conversations);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // Get messages for a conversation
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<?> getMessages(
            @PathVariable String conversationId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            Conversation conv = chatAuth.requireParticipantConversation(authUser, conversationId);
            List<ChatMessage> messages = chatMessageRepository.findByLeadIdOrderBySentAtAsc(conv.getId());
            // Filter out deleted messages
            messages = messages.stream()
                .filter(m -> m.getDeletedAt() == null)
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(messages);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // Send a message
    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(
            @Valid @RequestBody Map<String, Object> dto,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            String conversationId = (String) dto.get("conversationId");
            chatAuth.requireParticipantConversation(authUser, conversationId);
            ConnectSecurity.assertActorIsSelf(authUser, (String) dto.get("senderId"));

            ChatMessage message = new ChatMessage();
            message.setLeadId(UUID.fromString(conversationId));
            message.setSenderId(ConnectSecurity.requireUserId(authUser));
            
            message.setMessage((String) dto.get("message"));
            message.setMessageType(dto.get("messageType") != null ? (String) dto.get("messageType") : "TEXT");
            message.setAttachmentUrl((String) dto.get("attachmentUrl"));
            message.setIsRead(false);
            message.setSentAt(LocalDateTime.now());
            message.setDeliveredAt(LocalDateTime.now()); // Mark as delivered immediately
            
            // Handle reply to message
            String replyToId = (String) dto.get("replyToId");
            if (replyToId != null && !replyToId.isEmpty()) {
                message.setReplyToId(UUID.fromString(replyToId));
                message.setReplyPreview((String) dto.get("replyPreview"));
            }
            
            // Handle forwarded message
            String forwardedFromId = (String) dto.get("forwardedFromId");
            if (forwardedFromId != null && !forwardedFromId.isEmpty()) {
                message.setForwardedFromId(UUID.fromString(forwardedFromId));
            }
            
            // Handle audio/voice message
            if ("AUDIO".equals(message.getMessageType())) {
                Object duration = dto.get("audioDurationSeconds");
                if (duration != null) {
                    message.setAudioDurationSeconds(((Number) duration).intValue());
                }
                message.setAudioWaveform((String) dto.get("audioWaveform"));
            }

            ChatMessage saved = chatMessageRepository.save(message);
            
            // Update conversation last message
            try {
                Optional<Conversation> convOpt = conversationRepository.findById(message.getLeadId());
                if (convOpt.isPresent()) {
                    Conversation conv = convOpt.get();
                    conv.setLastMessage(message.getMessage());
                    conv.setLastMessageAt(LocalDateTime.now());
                    conv.setLastMessageSenderId(message.getSenderId());
                    conv.setUpdatedAt(LocalDateTime.now());
                    conversationRepository.save(conv);
                }
            } catch (Exception e) {
                // Ignore conversation update errors
            }

            chatRealtimePublisher.publishMessage(saved);
            return ResponseEntity.ok(saved);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Reply to a message
    @PostMapping("/messages/{messageId}/reply")
    public ResponseEntity<?> replyToMessage(
            @PathVariable String messageId,
            @Valid @RequestBody Map<String, Object> dto,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            ConnectSecurity.assertActorIsSelf(authUser, (String) dto.get("senderId"));
            ChatMessage originalMsg = chatAuth.requireParticipantMessage(authUser, messageId);
            UUID replyToUUID = originalMsg.getId();

            ChatMessage reply = new ChatMessage();
            reply.setLeadId(originalMsg.getLeadId());
            reply.setSenderId(ConnectSecurity.requireUserId(authUser));
            reply.setMessage((String) dto.get("message"));
            reply.setMessageType(dto.get("messageType") != null ? (String) dto.get("messageType") : "TEXT");
            reply.setReplyToId(replyToUUID);
            reply.setReplyPreview(originalMsg.getMessage() != null ? 
                originalMsg.getMessage().substring(0, Math.min(100, originalMsg.getMessage().length())) : "");
            reply.setIsRead(false);
            reply.setSentAt(LocalDateTime.now());
            reply.setDeliveredAt(LocalDateTime.now());
            
            ChatMessage saved = chatMessageRepository.save(reply);
            chatRealtimePublisher.publishMessage(saved);

            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId().toString());
            response.put("conversationId", saved.getLeadId().toString());
            response.put("senderId", saved.getSenderId().toString());
            response.put("message", saved.getMessage());
            response.put("replyToId", messageId);
            response.put("replyPreview", saved.getReplyPreview());
            response.put("sentAt", saved.getSentAt().toString());
            
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Forward a message to other conversations
    @PostMapping("/messages/{messageId}/forward")
    public ResponseEntity<?> forwardMessage(
            @PathVariable String messageId,
            @Valid @RequestBody Map<String, Object> dto,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            ConnectSecurity.assertActorIsSelf(authUser, (String) dto.get("senderId"));
            ChatMessage originalMsg = chatAuth.requireParticipantMessage(authUser, messageId);
            UUID originalMsgId = originalMsg.getId();
            UUID senderId = ConnectSecurity.requireUserId(authUser);

            @SuppressWarnings("unchecked")
            List<String> toConversationIds = (List<String>) dto.get("toConversationIds");

            if (toConversationIds == null || toConversationIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No target conversations specified"));
            }

            List<Map<String, Object>> forwardedMessages = new ArrayList<>();

            for (String convId : toConversationIds) {
                chatAuth.requireParticipantConversation(authUser, convId);
                ChatMessage forwarded = new ChatMessage();
                forwarded.setLeadId(UUID.fromString(convId));
                forwarded.setSenderId(senderId);
                forwarded.setMessage(originalMsg.getMessage());
                forwarded.setMessageType(originalMsg.getMessageType());
                forwarded.setAttachmentUrl(originalMsg.getAttachmentUrl());
                forwarded.setForwardedFromId(originalMsgId);
                forwarded.setIsRead(false);
                forwarded.setSentAt(LocalDateTime.now());
                forwarded.setDeliveredAt(LocalDateTime.now());
                
                ChatMessage saved = chatMessageRepository.save(forwarded);
                chatRealtimePublisher.publishMessage(saved);

                Map<String, Object> msgInfo = new HashMap<>();
                msgInfo.put("id", saved.getId().toString());
                msgInfo.put("conversationId", convId);
                msgInfo.put("forwardedFromId", messageId);
                forwardedMessages.add(msgInfo);
            }
            
            return ResponseEntity.ok(Map.of(
                "message", "Message forwarded successfully",
                "forwardedTo", forwardedMessages.size(),
                "messages", forwardedMessages
            ));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Edit a message
    @PutMapping("/messages/{messageId}")
    public ResponseEntity<?> editMessage(
            @PathVariable String messageId,
            @Valid @RequestBody Map<String, String> dto,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            ConnectSecurity.assertActorIsSelf(authUser, dto.get("senderId"));
            ChatMessage msg = chatAuth.requireParticipantMessage(authUser, messageId);
            chatAuth.assertMessageSender(authUser, msg);
            
            msg.setMessage(dto.get("message"));
            msg.setEditedAt(LocalDateTime.now());
            chatMessageRepository.save(msg);
            
            return ResponseEntity.ok(Map.of(
                "id", messageId,
                "message", msg.getMessage(),
                "editedAt", msg.getEditedAt().toString()
            ));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Mark messages as read
    @PutMapping("/conversations/{conversationId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable String conversationId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            Conversation conv = chatAuth.requireParticipantConversation(authUser, conversationId);
            List<ChatMessage> unreadMessages = chatMessageRepository.findUnreadMessages(conv.getId());

            for (ChatMessage msg : unreadMessages) {
                msg.setIsRead(true);
                msg.setReadAt(LocalDateTime.now());
                chatMessageRepository.save(msg);
            }

            return ResponseEntity.ok(Map.of("message", "Messages marked as read", "count", unreadMessages.size()));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Delete a message (soft delete)
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<?> deleteMessage(
            @PathVariable String messageId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            ChatMessage msg = chatAuth.requireParticipantMessage(authUser, messageId);
            chatAuth.assertMessageSender(authUser, msg);
            msg.setDeletedAt(LocalDateTime.now());
            chatMessageRepository.save(msg);
            return ResponseEntity.ok(Map.of("message", "Message deleted"));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Create a new conversation
    @PostMapping("/conversations")
    public ResponseEntity<?> createConversation(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            ConnectSecurity.assertActorIsSelf(authUser, (String) request.get("senderId"));
            Set<String> participantIdSet = new LinkedHashSet<>();
            Object participantsObj = request.get("participantIds");
            if (participantsObj instanceof List) {
                for (Object p : (List<?>) participantsObj) {
                    String id = p.toString().trim();
                    if (!id.isEmpty()) {
                        participantIdSet.add(id);
                    }
                }
            }
            String senderId = (String) request.get("senderId");
            String recipientId = (String) request.get("recipientId");
            
            // Add sender and recipient if provided
            if (senderId != null && !senderId.trim().isEmpty()) {
                participantIdSet.add(senderId.trim());
            }
            if (recipientId != null && !recipientId.trim().isEmpty()) {
                participantIdSet.add(recipientId.trim());
            }
            
            // Convert to UUIDs (validate each one)
            List<UUID> participantUUIDs = new ArrayList<>();
            for (String idStr : participantIdSet) {
                try {
                    UUID uuid = UUID.fromString(idStr);
                    if (!participantUUIDs.contains(uuid)) {
                        participantUUIDs.add(uuid);
                    }
                } catch (Exception e) {
                    // Skip invalid UUIDs
                    System.err.println("Invalid UUID skipped: " + idStr);
                }
            }
            
            if (participantUUIDs.size() < 2) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "A conversation requires at least 2 participants",
                    "providedCount", participantUUIDs.size()
                ));
            }

            chatAuth.assertCreatingConversationIncludesSelf(authUser, participantUUIDs);

            // Check if a direct conversation already exists between these participants
            if (participantUUIDs.size() == 2) {
                Conversation existing = conversationRepository.findDirectConversation(participantUUIDs.get(0), participantUUIDs.get(1));
                if (existing != null) {
                    return ResponseEntity.ok(Map.of(
                        "id", existing.getId().toString(),
                        "message", "Conversation already exists",
                        "existing", true
                    ));
                }
            }
            
            // Create new conversation with participants
            Conversation conversation = Conversation.builder()
                .conversationType("DIRECT")
                .participantIds(participantUUIDs)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();
            
            // Save conversation (JPA will automatically save participants via @ElementCollection)
            conversation = conversationRepository.save(conversation);
            
            // Also create a system message for the conversation
            ChatMessage systemMessage = new ChatMessage();
            systemMessage.setLeadId(conversation.getId());
            systemMessage.setMessage("Conversation started");
            systemMessage.setMessageType("SYSTEM");
            systemMessage.setIsRead(true);
            systemMessage.setSentAt(LocalDateTime.now());
            chatMessageRepository.save(systemMessage);

            return ResponseEntity.ok(Map.of(
                "id", conversation.getId().toString(),
                "message", "Conversation created successfully",
                "participantIds", new ArrayList<>(participantIdSet)
            ));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Search messages
    @GetMapping("/search")
    public ResponseEntity<?> searchMessages(
            @RequestParam String query,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID self = ConnectSecurity.requireUserId(authUser);
            Set<UUID> allowedConvIds = chatAuth.participantConversationIds(self);
            if (allowedConvIds.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }
            List<ChatMessage> filtered =
                    chatMessageRepository.searchInConversations(allowedConvIds, query.trim());
            return ResponseEntity.ok(filtered);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // Delete a conversation and all its messages
    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<?> deleteConversation(
            @PathVariable String conversationId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            Conversation conv = chatAuth.requireParticipantConversation(authUser, conversationId);
            List<ChatMessage> messages = chatMessageRepository.findByLeadId(conv.getId());
            
            // Soft delete all messages (set deletedAt)
            LocalDateTime now = LocalDateTime.now();
            for (ChatMessage msg : messages) {
                msg.setDeletedAt(now);
            }
            chatMessageRepository.saveAll(messages);
            
            return ResponseEntity.ok(Map.of(
                "message", "Conversation deleted",
                "deletedMessages", messages.size()
            ));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Get unread count
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(
            @RequestParam(required = false) String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID userUUID = chatAuth.effectiveUserId(authUser, userId);
            String userIdStr = userUUID.toString();
            Set<UUID> allowedConvIds = chatAuth.participantConversationIds(userUUID);
            long count = 0;
            if (!allowedConvIds.isEmpty()) {
                for (UUID convId : allowedConvIds) {
                    count += chatMessageRepository.findByLeadId(convId).stream()
                            .filter(m -> m.getDeletedAt() == null)
                            .filter(m -> m.getIsRead() == null || !m.getIsRead())
                            .filter(m -> m.getSenderId() != null
                                    && !m.getSenderId().toString().equals(userIdStr))
                            .count();
                }
            }
            return ResponseEntity.ok(Map.of("count", count));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("count", 0));
        }
    }
}
