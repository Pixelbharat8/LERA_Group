package com.lera.connect_service.service;

import com.lera.connect_service.entity.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/** Pushes saved chat messages to STOMP subscribers on /topic/chat/{conversationId}. */
@Service
@RequiredArgsConstructor
public class ChatRealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishMessage(ChatMessage saved) {
        if (saved == null || saved.getLeadId() == null || saved.getId() == null) {
            return;
        }
        String conversationId = saved.getLeadId().toString();
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", saved.getId().toString());
        payload.put("conversationId", conversationId);
        if (saved.getSenderId() != null) {
            payload.put("senderId", saved.getSenderId().toString());
        }
        payload.put("message", saved.getMessage());
        payload.put("messageType", saved.getMessageType() != null ? saved.getMessageType() : "TEXT");
        if (saved.getAttachmentUrl() != null) {
            payload.put("attachmentUrl", saved.getAttachmentUrl());
        }
        if (saved.getReplyToId() != null) {
            payload.put("replyToId", saved.getReplyToId().toString());
        }
        if (saved.getReplyPreview() != null) {
            payload.put("replyPreview", saved.getReplyPreview());
        }
        if (saved.getForwardedFromId() != null) {
            payload.put("forwardedFromId", saved.getForwardedFromId().toString());
        }
        if (saved.getSentAt() != null) {
            payload.put("sentAt", saved.getSentAt().toString());
        }
        payload.put("isRead", Boolean.TRUE.equals(saved.getIsRead()));
        messagingTemplate.convertAndSend("/topic/chat/" + conversationId, payload);
    }
}
