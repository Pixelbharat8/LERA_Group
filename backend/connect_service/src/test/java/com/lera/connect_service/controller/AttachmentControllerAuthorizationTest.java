package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ChatAttachment;
import com.lera.connect_service.entity.ChatMessage;
import com.lera.connect_service.entity.Conversation;
import com.lera.connect_service.repository.ChatAttachmentRepository;
import com.lera.connect_service.repository.ChatMessageRepository;
import com.lera.connect_service.repository.ConversationRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ChatAuthorizationService;
import com.lera.connect_service.security.ConnectTestAuth;
import com.lera.connect_service.storage.ConnectAttachmentStorage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttachmentControllerAuthorizationTest {

    @Mock
    private ChatAttachmentRepository attachmentRepository;
    @Mock
    private ConnectAttachmentStorage attachmentStorage;
    @Mock
    private ConversationRepository conversationRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;

    private AttachmentController controller;

    private final UUID member = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID outsider = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final UUID conversationId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private final UUID messageId = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");

    @BeforeEach
    void setUp() {
        ChatAuthorizationService chatAuth =
                new ChatAuthorizationService(conversationRepository, chatMessageRepository);
        controller = new AttachmentController(attachmentRepository, attachmentStorage, chatAuth);
    }

    @Test
    void getAttachmentsForMessage_outsider_forbidden() {
        Conversation conversation = new Conversation();
        conversation.setId(conversationId);
        conversation.setIsActive(true);
        conversation.setParticipantIds(List.of(member));

        ChatMessage message = new ChatMessage();
        message.setId(messageId);
        message.setLeadId(conversationId);

        when(chatMessageRepository.findById(messageId)).thenReturn(Optional.of(message));
        when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));

        AuthUser user = ConnectTestAuth.participant(outsider);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getAttachmentsForMessage(messageId.toString(), user));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void deleteAttachment_outsider_forbidden() {
        UUID attachmentId = UUID.randomUUID();
        ChatAttachment attachment = new ChatAttachment();
        attachment.setId(attachmentId);
        attachment.setUploadedBy(member);
        attachment.setFileUrl("/api/attachments/files/secret.pdf");

        when(attachmentRepository.findById(attachmentId)).thenReturn(Optional.of(attachment));

        AuthUser user = ConnectTestAuth.participant(outsider);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.deleteAttachment(attachmentId.toString(), user));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
