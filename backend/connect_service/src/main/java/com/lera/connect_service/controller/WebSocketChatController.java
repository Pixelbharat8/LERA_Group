package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ChatMessage;
import com.lera.connect_service.repository.ChatMessageRepository;
import com.lera.connect_service.service.ChatRealtimePublisher;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ChatAuthorizationService;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * WebSocket Controller for real-time messaging
 *
 * <p>Authorization is enforced in {@link com.lera.connect_service.security.StompChannelSecurityInterceptor}
 * (subscribe/send destinations) and again here using {@link ChatAuthorizationService}.</p>
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatAuthorizationService chatAuth;
    private final ChatRealtimePublisher chatRealtimePublisher;

    private AuthUser requireUser() {
        return CurrentUser.get()
                .orElseThrow(() -> new AccessDeniedException("Authenticated WebSocket session required"));
    }

    @MessageMapping("/chat/{conversationId}")
    public void sendMessage(
            @DestinationVariable String conversationId,
            @Payload Map<String, Object> payload) {

        try {
            AuthUser authUser = requireUser();
            chatAuth.requireParticipantConversation(authUser, conversationId);
            Object payloadSender = payload.get("senderId");
            if (payloadSender != null) {
                ConnectSecurity.assertActorIsSelf(authUser, payloadSender.toString());
            }
            UUID senderId = ConnectSecurity.requireUserId(authUser);

            ChatMessage message = ChatMessage.builder()
                    .leadId(UUID.fromString(conversationId.trim()))
                    .senderId(senderId)
                    .message((String) payload.get("message"))
                    .messageType((String) payload.getOrDefault("messageType", "TEXT"))
                    .attachmentUrl((String) payload.get("attachmentUrl"))
                    .isRead(false)
                    .sentAt(LocalDateTime.now())
                    .build();

            ChatMessage saved = chatMessageRepository.save(message);
            chatRealtimePublisher.publishMessage(saved);
        } catch (AccessDeniedException ex) {
            throw ex;
        } catch (Exception e) {
            log.error("Error sending WebSocket message", e);
        }
    }

    @MessageMapping("/typing/{conversationId}")
    @SendTo("/topic/typing/{conversationId}")
    public Map<String, Object> typingIndicator(
            @DestinationVariable String conversationId,
            @Payload Map<String, Object> payload) {

        AuthUser authUser = requireUser();
        chatAuth.requireParticipantConversation(authUser, conversationId);
        Object payloadUserId = payload.get("userId");
        if (payloadUserId != null) {
            ConnectSecurity.assertActorIsSelf(authUser, payloadUserId.toString());
        }

        return Map.of(
                "conversationId", conversationId,
                "userId", ConnectSecurity.requireUserId(authUser).toString(),
                "userName", payload.getOrDefault("userName", ""),
                "isTyping", payload.getOrDefault("isTyping", false),
                "timestamp", LocalDateTime.now().toString()
        );
    }

    @MessageMapping("/read/{conversationId}")
    @SendTo("/topic/read/{conversationId}")
    public Map<String, Object> readReceipt(
            @DestinationVariable String conversationId,
            @Payload Map<String, Object> payload) {

        AuthUser authUser = requireUser();
        chatAuth.requireParticipantConversation(authUser, conversationId);
        Object payloadUserId = payload.get("userId");
        if (payloadUserId != null) {
            ConnectSecurity.assertActorIsSelf(authUser, payloadUserId.toString());
        }
        UUID selfId = ConnectSecurity.requireUserId(authUser);

        String messageId = payload.get("messageId") != null ? payload.get("messageId").toString() : null;

        if (messageId != null && !messageId.isBlank()) {
            try {
                ChatMessage msg = chatAuth.requireParticipantMessage(authUser, messageId);
                if (!conversationId.equals(msg.getLeadId().toString())) {
                    throw new AccessDeniedException("Message does not belong to this conversation");
                }
                msg.setIsRead(true);
                msg.setReadAt(LocalDateTime.now());
                chatMessageRepository.save(msg);
            } catch (AccessDeniedException ex) {
                throw ex;
            } catch (Exception e) {
                log.error("Error marking message as read over WebSocket", e);
            }
        }

        return Map.of(
                "conversationId", conversationId,
                "userId", selfId.toString(),
                "messageId", messageId != null ? messageId : "",
                "readAt", LocalDateTime.now().toString()
        );
    }

    /**
     * Relays WebRTC signaling (offer / answer / ICE / hangup) to all participants on the conversation.
     * {@code fromUserId} is always taken from the authenticated principal.
     */
    @MessageMapping("/webrtc/{conversationId}")
    @SendTo("/topic/webrtc/{conversationId}")
    public Map<String, Object> relayWebrtcSignaling(
            @DestinationVariable String conversationId,
            @Payload Map<String, Object> payload) {
        AuthUser authUser = requireUser();
        chatAuth.requireParticipantConversation(authUser, conversationId);
        Object payloadUserId = payload != null ? payload.get("userId") : null;
        if (payloadUserId != null) {
            ConnectSecurity.assertActorIsSelf(authUser, payloadUserId.toString());
        }
        if (payload == null || payload.isEmpty()) {
            throw new AccessDeniedException("WebRTC payload required");
        }
        String type = payload.get("type") != null ? payload.get("type").toString().trim() : "";
        if (type.isEmpty()) {
            throw new AccessDeniedException("WebRTC type required");
        }

        Map<String, Object> body = new HashMap<>(payload);
        body.put("fromUserId", ConnectSecurity.requireUserId(authUser).toString());
        body.put("conversationId", conversationId);
        body.put("timestamp", LocalDateTime.now().toString());
        return body;
    }

    @MessageMapping("/reaction/{conversationId}")
    @SendTo("/topic/reaction/{conversationId}")
    public Map<String, Object> messageReaction(
            @DestinationVariable String conversationId,
            @Payload Map<String, Object> payload) {

        AuthUser authUser = requireUser();
        chatAuth.requireParticipantConversation(authUser, conversationId);
        Object payloadUserId = payload.get("userId");
        if (payloadUserId != null) {
            ConnectSecurity.assertActorIsSelf(authUser, payloadUserId.toString());
        }

        return Map.of(
                "conversationId", conversationId,
                "messageId", payload.getOrDefault("messageId", ""),
                "userId", ConnectSecurity.requireUserId(authUser).toString(),
                "userName", payload.getOrDefault("userName", ""),
                "reaction", payload.getOrDefault("reaction", "👍"),
                "timestamp", LocalDateTime.now().toString()
        );
    }

    @MessageMapping("/presence")
    @SendTo("/topic/presence")
    public Map<String, Object> userPresence(@Payload Map<String, Object> payload) {
        AuthUser authUser = requireUser();
        Object payloadUserId = payload.get("userId");
        if (payloadUserId != null) {
            ConnectSecurity.assertActorIsSelf(authUser, payloadUserId.toString());
        }

        return Map.of(
                "userId", ConnectSecurity.requireUserId(authUser).toString(),
                "userName", payload.getOrDefault("userName", ""),
                "status", payload.getOrDefault("status", "online"),
                "lastSeen", LocalDateTime.now().toString()
        );
    }

    public void sendToUser(String userId, String destination, Object payload) {
        messagingTemplate.convertAndSendToUser(userId, destination, payload);
    }

    public void broadcast(String topic, Object payload) {
        messagingTemplate.convertAndSend(topic, payload);
    }
}
