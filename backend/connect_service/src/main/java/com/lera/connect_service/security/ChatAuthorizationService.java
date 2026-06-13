package com.lera.connect_service.security;

import com.lera.connect_service.entity.ChatAttachment;
import com.lera.connect_service.entity.ChatMessage;
import com.lera.connect_service.entity.Conversation;
import com.lera.connect_service.repository.ChatMessageRepository;
import com.lera.connect_service.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatAuthorizationService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;

    public UUID effectiveUserId(AuthUser user, String requestedUserId) {
        if (requestedUserId == null || requestedUserId.isBlank()) {
            return ConnectSecurity.requireUserId(user);
        }
        ConnectSecurity.assertQueryUserIsSelf(user, requestedUserId);
        return UUID.fromString(requestedUserId.trim());
    }

    public Conversation requireParticipantConversation(AuthUser user, String conversationIdRaw) {
        UUID conversationId = ConnectSecurity.parseUuid(conversationIdRaw, "conversationId");
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
        ConnectSecurity.assertCanAccessConversation(user, conversation);
        return conversation;
    }

    public ChatMessage requireParticipantMessage(AuthUser user, String messageIdRaw) {
        UUID messageId = ConnectSecurity.parseUuid(messageIdRaw, "messageId");
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));
        requireParticipantConversation(user, message.getLeadId().toString());
        return message;
    }

    public void assertMessageSender(AuthUser user, ChatMessage message) {
        UUID self = ConnectSecurity.requireUserId(user);
        if (message.getSenderId() == null || !message.getSenderId().equals(self)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Can only modify your own messages");
        }
    }

    public Set<UUID> participantConversationIds(UUID userId) {
        return conversationRepository.findByParticipantId(userId).stream()
                .filter(c -> c.getIsActive() == null || c.getIsActive())
                .map(Conversation::getId)
                .collect(Collectors.toCollection(HashSet::new));
    }

    public void assertCreatingConversationIncludesSelf(AuthUser user, List<UUID> participantIds) {
        UUID self = ConnectSecurity.requireUserId(user);
        if (participantIds == null || !participantIds.contains(self)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You must be included as a conversation participant");
        }
    }

    public void assertCanAccessAttachment(AuthUser user, ChatAttachment attachment) {
        if (attachment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found");
        }
        if (attachment.getMessageId() != null) {
            requireParticipantMessage(user, attachment.getMessageId().toString());
            return;
        }
        UUID self = ConnectSecurity.requireUserId(user);
        if (attachment.getUploadedBy() != null && attachment.getUploadedBy().equals(self)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access this attachment");
    }

    public void assertCanDeleteAttachment(AuthUser user, ChatAttachment attachment) {
        if (attachment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found");
        }
        UUID self = ConnectSecurity.requireUserId(user);
        if (attachment.getUploadedBy() != null && attachment.getUploadedBy().equals(self)) {
            return;
        }
        if (ConnectSecurity.isOrgWide(user)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete this attachment");
    }
}
