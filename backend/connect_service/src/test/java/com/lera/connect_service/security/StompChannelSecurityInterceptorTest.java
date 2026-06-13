package com.lera.connect_service.security;

import com.lera.connect_service.entity.Conversation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StompChannelSecurityInterceptorTest {

    @Mock
    private ChatAuthorizationService chatAuthorizationService;

    @InjectMocks
    private StompChannelSecurityInterceptor interceptor;

    private final UUID convId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @Test
    void extractConversationId_appChat() {
        Optional<String> id = StompChannelSecurityInterceptor.extractConversationId(
                "/app/chat/cccccccc-cccc-cccc-cccc-cccccccccccc");
        assertTrue(id.isPresent());
        assertEquals(convId.toString(), id.get());
    }

    @Test
    void extractConversationId_topicTyping() {
        Optional<String> id = StompChannelSecurityInterceptor.extractConversationId(
                "/topic/typing/cccccccc-cccc-cccc-cccc-cccccccccccc");
        assertTrue(id.isPresent());
    }

    @Test
    void extractConversationId_appWebrtc() {
        Optional<String> id = StompChannelSecurityInterceptor.extractConversationId(
                "/app/webrtc/cccccccc-cccc-cccc-cccc-cccccccccccc");
        assertTrue(id.isPresent());
        assertEquals(convId.toString(), id.get());
    }

    @Test
    void extractConversationId_topicWebrtc() {
        Optional<String> id = StompChannelSecurityInterceptor.extractConversationId(
                "/topic/webrtc/cccccccc-cccc-cccc-cccc-cccccccccccc");
        assertTrue(id.isPresent());
    }

    @Test
    void extractConversationId_presenceTopic_empty() {
        assertTrue(StompChannelSecurityInterceptor.extractConversationId("/topic/presence").isEmpty());
    }

    @Test
    void requireParticipantConversation_delegatesToService() {
        AuthUser user = ConnectTestAuth.participant(UUID.randomUUID());
        Conversation conv = Conversation.builder()
                .id(convId)
                .participantIds(List.of(user.getUserId(), UUID.randomUUID()))
                .isActive(true)
                .build();
        when(chatAuthorizationService.requireParticipantConversation(user, convId.toString()))
                .thenReturn(conv);

        Conversation result = chatAuthorizationService.requireParticipantConversation(user, convId.toString());
        assertEquals(convId, result.getId());
        verify(chatAuthorizationService).requireParticipantConversation(user, convId.toString());
    }

    @Test
    void assertCanAccessConversation_outsider_forbidden() {
        AuthUser outsider = ConnectTestAuth.participant(UUID.randomUUID());
        Conversation conv = Conversation.builder()
                .id(convId)
                .participantIds(List.of(UUID.randomUUID()))
                .isActive(true)
                .build();

        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> ConnectSecurity.assertCanAccessConversation(outsider, conv));
    }
}
