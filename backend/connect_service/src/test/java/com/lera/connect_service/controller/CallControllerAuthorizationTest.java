package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Conversation;
import com.lera.connect_service.repository.ConversationRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectTestAuth;
import com.lera.connect_service.service.PushDispatcher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CallControllerAuthorizationTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private PushDispatcher pushDispatcher;

    private CallController controller;

    private final UUID convId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private final UUID alice = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID bob = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() throws Exception {
        controller = new CallController(conversationRepository, messagingTemplate, pushDispatcher);
        Field calls = CallController.class.getDeclaredField("activeCalls");
        calls.setAccessible(true);
        @SuppressWarnings("unchecked")
        Map<String, CallController.CallSession> map =
                (Map<String, CallController.CallSession>) calls.get(null);
        map.clear();
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
    void initiateCall_participant_succeeds() {
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(directConv()));
        AuthUser aliceUser = ConnectTestAuth.participant(alice);

        CallController.InitiateCallRequest req = new CallController.InitiateCallRequest();
        req.conversationId = convId.toString();
        req.callerId = alice.toString();
        req.callType = "VOICE";

        ResponseEntity<?> res = controller.initiateCall(req, aliceUser);
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void initiateCall_sendsPushToOtherParticipants() {
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(directConv()));
        AuthUser aliceUser = ConnectTestAuth.participant(alice);

        CallController.InitiateCallRequest req = new CallController.InitiateCallRequest();
        req.conversationId = convId.toString();
        req.callerId = alice.toString();
        req.callType = "VOICE";

        assertEquals(200, controller.initiateCall(req, aliceUser).getStatusCode().value());

        verify(pushDispatcher).send(eq(bob), eq("LERA Connect"), eq("Voice call"),
                argThat((Map<String, String> m) ->
                        m != null
                                && "incoming_call".equals(m.get("lera_type"))
                                && convId.toString().equals(m.get("lera_conversation_id"))
                                && "VOICE".equals(m.get("lera_call_kind"))
                                && alice.toString().equals(m.get("lera_caller_id"))
                                && m.get("lera_call_id") != null
                                && !m.get("lera_call_id").isBlank()));
    }

    @Test
    void initiateCall_spoofedCaller_forbidden() {
        AuthUser aliceUser = ConnectTestAuth.participant(alice);
        CallController.InitiateCallRequest req = new CallController.InitiateCallRequest();
        req.conversationId = convId.toString();
        req.callerId = bob.toString();
        req.callType = "VOICE";

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.initiateCall(req, aliceUser));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void initiateCall_nonParticipant_forbidden() {
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(directConv()));
        UUID outsider = UUID.randomUUID();
        AuthUser outsiderUser = ConnectTestAuth.participant(outsider);

        CallController.InitiateCallRequest req = new CallController.InitiateCallRequest();
        req.conversationId = convId.toString();
        req.callType = "VOICE";

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.initiateCall(req, outsiderUser));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void declineCall_broadcastsHangupToCaller() {
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(directConv()));
        AuthUser aliceUser = ConnectTestAuth.participant(alice);

        CallController.InitiateCallRequest req = new CallController.InitiateCallRequest();
        req.conversationId = convId.toString();
        req.callerId = alice.toString();
        req.callType = "VOICE";

        @SuppressWarnings("unchecked")
        Map<String, Object> initBody = (Map<String, Object>) Objects.requireNonNull(
                controller.initiateCall(req, aliceUser).getBody());
        String callId = (String) initBody.get("callId");

        AuthUser bobUser = ConnectTestAuth.participant(bob);
        assertEquals(200, controller.declineCall(callId, bob.toString(), bobUser).getStatusCode().value());

        verify(messagingTemplate).convertAndSend(
                eq("/topic/webrtc/" + convId),
                argThat((Object payload) -> {
                    if (!(payload instanceof Map<?, ?> m)) return false;
                    return "hangup".equals(m.get("type"))
                            && callId.equals(m.get("callId"))
                            && "declined".equals(m.get("reason"))
                            && bob.toString().equals(m.get("fromUserId"));
                }));

        verify(pushDispatcher).send(eq(alice), eq("LERA Connect"), eq("Call declined"),
                argThat((Map<String, String> m) ->
                        m != null
                                && "call_ended".equals(m.get("lera_type"))
                                && callId.equals(m.get("lera_call_id"))
                                && "declined".equals(m.get("lera_reason"))));
    }

    @Test
    void endCall_broadcastsHangupToOtherParticipant() {
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(directConv()));
        AuthUser aliceUser = ConnectTestAuth.participant(alice);

        CallController.InitiateCallRequest req = new CallController.InitiateCallRequest();
        req.conversationId = convId.toString();
        req.callerId = alice.toString();
        req.callType = "VOICE";

        @SuppressWarnings("unchecked")
        Map<String, Object> initBody = (Map<String, Object>) Objects.requireNonNull(
                controller.initiateCall(req, aliceUser).getBody());
        String callId = (String) initBody.get("callId");

        assertEquals(200, controller.endCall(callId, alice.toString(), aliceUser).getStatusCode().value());

        verify(messagingTemplate).convertAndSend(
                eq("/topic/webrtc/" + convId),
                argThat((Object payload) -> {
                    if (!(payload instanceof Map<?, ?> m)) return false;
                    return "hangup".equals(m.get("type"))
                            && callId.equals(m.get("callId"))
                            && "ended".equals(m.get("reason"))
                            && alice.toString().equals(m.get("fromUserId"));
                }));

        verify(pushDispatcher).send(eq(bob), eq("LERA Connect"), eq("Call ended"),
                argThat((Map<String, String> m) ->
                        m != null
                                && "call_ended".equals(m.get("lera_type"))
                                && callId.equals(m.get("lera_call_id"))
                                && "ended".equals(m.get("lera_reason"))));
    }

    @Test
    void getActiveCalls_includesCalleeAfterInitiate() {
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(directConv()));
        AuthUser aliceUser = ConnectTestAuth.participant(alice);

        CallController.InitiateCallRequest req = new CallController.InitiateCallRequest();
        req.conversationId = convId.toString();
        req.callerId = alice.toString();
        req.callType = "VOICE";

        assertEquals(200, controller.initiateCall(req, aliceUser).getStatusCode().value());

        AuthUser bobUser = ConnectTestAuth.participant(bob);
        ResponseEntity<?> res = controller.getActiveCalls(bob.toString(), bobUser);
        assertEquals(200, res.getStatusCode().value());
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> body = (List<Map<String, Object>>) res.getBody();
        assertEquals(1, body.size());
        assertEquals(alice.toString(), body.get(0).get("callerId"));
        assertEquals("RINGING", body.get(0).get("status"));
    }

    @Test
    void getActiveCalls_otherUser_forbidden() {
        AuthUser aliceUser = ConnectTestAuth.participant(alice);
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.getActiveCalls(bob.toString(), aliceUser));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
