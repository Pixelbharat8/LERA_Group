package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ChatMessage;
import com.lera.connect_service.entity.Conversation;
import com.lera.connect_service.repository.ChatMessageRepository;
import com.lera.connect_service.repository.ConversationRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ChatAuthorizationService;
import com.lera.connect_service.security.ConnectTestAuth;
import com.lera.connect_service.service.ChatRealtimePublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatControllerAuthorizationTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ChatRealtimePublisher chatRealtimePublisher;

    private ChatController controller;

    private final UUID convId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private final UUID alice = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID bob = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final UUID msgId = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");

    @BeforeEach
    void setUp() {
        ChatAuthorizationService chatAuth = new ChatAuthorizationService(conversationRepository, chatMessageRepository);
        controller = new ChatController(
                chatMessageRepository, conversationRepository, chatAuth, chatRealtimePublisher, restTemplate);
    }

    private Conversation directConv() {
        return Conversation.builder()
                .id(convId)
                .conversationType("DIRECT")
                .participantIds(List.of(alice, bob))
                .isActive(true)
                .build();
    }

    @Test
    void getMessages_participant_ok() {
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(directConv()));
        when(chatMessageRepository.findByLeadIdOrderBySentAtAsc(convId)).thenReturn(List.of());

        AuthUser aliceUser = ConnectTestAuth.participant(alice);
        ResponseEntity<?> res = controller.getMessages(convId.toString(), aliceUser);
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void getMessages_outsider_forbidden() {
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(directConv()));
        AuthUser outsider = ConnectTestAuth.participant(UUID.randomUUID());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.getMessages(convId.toString(), outsider));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void sendMessage_spoofedSender_forbidden() {
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(directConv()));
        AuthUser aliceUser = ConnectTestAuth.participant(alice);

        Map<String, Object> body = Map.of(
                "conversationId", convId.toString(),
                "senderId", bob.toString(),
                "message", "hi");

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.sendMessage(body, aliceUser));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void deleteMessage_notSender_forbidden() {
        ChatMessage msg = new ChatMessage();
        msg.setId(msgId);
        msg.setLeadId(convId);
        msg.setSenderId(bob);

        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.of(msg));
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(directConv()));

        AuthUser aliceUser = ConnectTestAuth.participant(alice);
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.deleteMessage(msgId.toString(), aliceUser));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
