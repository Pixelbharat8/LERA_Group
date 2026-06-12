package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Conversation;
import com.lera.connect_service.repository.ConversationRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.PushDispatcher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Call Controller - Voice and Video calling functionality
 * Similar to WhatsApp, Telegram, Teams calling features
 */
@RestController
@RequestMapping("/api/calls")
@PreAuthorize("isAuthenticated()")
@Slf4j
@RequiredArgsConstructor
public class CallController {

    private final ConversationRepository conversationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PushDispatcher pushDispatcher;

    // In-memory store for active calls (in production, use Redis or database)
    private static final Map<String, CallSession> activeCalls = new ConcurrentHashMap<>();

    public static class InitiateCallRequest {
        public String conversationId;
        public String callerId;
        public String callType; // VOICE or VIDEO
    }

    public static class CallSession {
        public String id;
        public String conversationId;
        public String callerId;
        public String callerName;
        public String callType;
        public String status; // RINGING, CONNECTED, ENDED
        public LocalDateTime startTime;
        public LocalDateTime endTime;
        public List<String> participants;

        public CallSession() {
            this.participants = new ArrayList<>();
        }

        public CallSession(String id, String conversationId, String callerId,
                          String callType, String status) {
            this.id = id;
            this.conversationId = conversationId;
            this.callerId = callerId;
            this.callType = callType;
            this.status = status;
            this.startTime = LocalDateTime.now();
            this.participants = new ArrayList<>();
            this.participants.add(callerId);
        }
    }

    private Conversation requireConversationForCaller(AuthUser authUser, String conversationIdRaw) {
        UUID conversationId = ConnectSecurity.parseUuid(conversationIdRaw, "conversationId");
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
        ConnectSecurity.assertCanAccessConversation(authUser, conversation);
        return conversation;
    }

    private CallSession requireCallSession(String callId) {
        CallSession session = activeCalls.get(callId);
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Call not found");
        }
        return session;
    }

    private void assertCanActOnCall(AuthUser authUser, CallSession session) {
        UUID self = ConnectSecurity.requireUserId(authUser);
        String selfId = self.toString();
        if (selfId.equals(session.callerId) || session.participants.contains(selfId)) {
            return;
        }
        UUID convId = ConnectSecurity.parseUuid(session.conversationId, "conversationId");
        Conversation conv = conversationRepository.findById(convId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed on this call"));
        ConnectSecurity.assertCanAccessConversation(authUser, conv);
    }

    /**
     * Notifies every other participant: STOMP hangup on the conversation topic (in-app)
     * and optional mobile push ({@code lera_type=call_ended}).
     */
    private void broadcastCallHangup(CallSession session, UUID actorUserId, String reason) {
        if (session == null || session.conversationId == null || session.conversationId.isBlank()) {
            return;
        }
        String conv = session.conversationId.trim();
        Map<String, Object> stomp = new HashMap<>();
        stomp.put("type", "hangup");
        stomp.put("callId", session.id);
        stomp.put("conversationId", conv);
        stomp.put("reason", reason);
        stomp.put("fromUserId", actorUserId.toString());
        try {
            messagingTemplate.convertAndSend("/topic/webrtc/" + conv, stomp);
        } catch (Exception e) {
            log.warn("webrtc hangup broadcast failed: {}", e.toString());
        }

        String actorStr = actorUserId.toString();
        Map<String, String> pushData = new HashMap<>();
        pushData.put("lera_type", "call_ended");
        pushData.put("lera_call_id", session.id);
        pushData.put("lera_conversation_id", conv);
        pushData.put("lera_reason", reason);
        if (session.participants == null) {
            return;
        }
        for (String pid : session.participants) {
            if (pid == null || pid.equals(actorStr)) {
                continue;
            }
            try {
                UUID target = UUID.fromString(pid);
                String body = "declined".equals(reason) ? "Call declined" : "Call ended";
                pushDispatcher.send(target, "LERA Connect", body, pushData);
            } catch (Exception e) {
                log.warn("call-ended push failed for {}: {}", pid, e.toString());
            }
        }
    }

    /**
     * Initiate a new call
     */
    @PostMapping("/initiate")
    public ResponseEntity<?> initiateCall(
            @Valid @RequestBody InitiateCallRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            ConnectSecurity.assertActorIsSelf(authUser, request.callerId);
            UUID callerId = ConnectSecurity.requireUserId(authUser);
            Conversation conv = requireConversationForCaller(authUser, request.conversationId);

            String callId = UUID.randomUUID().toString();
            CallSession session = new CallSession(
                callId,
                request.conversationId.trim(),
                callerId.toString(),
                request.callType,
                "RINGING"
            );
            session.callerName = "User";
            if (conv.getParticipantIds() != null) {
                for (UUID pid : conv.getParticipantIds()) {
                    if (pid == null) {
                        continue;
                    }
                    String ps = pid.toString();
                    if (!session.participants.contains(ps)) {
                        session.participants.add(ps);
                    }
                }
            }

            activeCalls.put(callId, session);

            log.info("Call initiated: {} - Type: {}", callId, request.callType);

            Map<String, Object> ring = new HashMap<>();
            ring.put("type", "ring");
            ring.put("callId", callId);
            ring.put("conversationId", request.conversationId.trim());
            ring.put("callerId", callerId.toString());
            ring.put("callType", request.callType != null ? request.callType : "VOICE");
            ring.put("timestamp", LocalDateTime.now().toString());
            messagingTemplate.convertAndSend("/topic/webrtc/" + request.conversationId.trim(), ring);

            String callKindUpper = request.callType != null && !request.callType.isBlank()
                    ? request.callType.trim().toUpperCase(Locale.ROOT)
                    : "VOICE";
            String callKindLabel = "VIDEO".equals(callKindUpper) ? "Video" : "Voice";
            try {
                if (conv.getParticipantIds() != null) {
                    for (UUID pid : conv.getParticipantIds()) {
                        if (pid == null || pid.equals(callerId)) {
                            continue;
                        }
                        Map<String, String> pushData = new HashMap<>();
                        pushData.put("lera_type", "incoming_call");
                        pushData.put("lera_call_id", callId);
                        pushData.put("lera_conversation_id", request.conversationId.trim());
                        pushData.put("lera_call_kind", callKindUpper);
                        pushData.put("lera_caller_id", callerId.toString());
                        pushDispatcher.send(pid, "LERA Connect", callKindLabel + " call", pushData);
                    }
                }
            } catch (Exception pushEx) {
                log.warn("Incoming-call push fan-out failed: {}", pushEx.toString());
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "callId", callId,
                "status", "RINGING",
                "message", "Call initiated successfully"
            ));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            log.error("Error initiating call", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Could not initiate call"
            ));
        }
    }

    /**
     * Answer an incoming call
     */
    @PostMapping("/{callId}/answer")
    public ResponseEntity<?> answerCall(
            @PathVariable String callId,
            @RequestParam String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertActorIsSelf(authUser, userId);
        UUID self = ConnectSecurity.requireUserId(authUser);
        CallSession session = requireCallSession(callId);
        assertCanActOnCall(authUser, session);

        session.status = "CONNECTED";
        String selfId = self.toString();
        if (!session.participants.contains(selfId)) {
            session.participants.add(selfId);
        }
        activeCalls.put(callId, session);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "status", "CONNECTED",
            "message", "Call connected"
        ));
    }

    /**
     * End a call
     */
    @PostMapping("/{callId}/end")
    public ResponseEntity<?> endCall(
            @PathVariable String callId,
            @RequestParam String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertActorIsSelf(authUser, userId);
        UUID actorId = ConnectSecurity.requireUserId(authUser);
        CallSession session = requireCallSession(callId);
        assertCanActOnCall(authUser, session);

        session.status = "ENDED";
        session.endTime = LocalDateTime.now();

        broadcastCallHangup(session, actorId, "ended");

        long durationSeconds = Duration.between(
            session.startTime,
            LocalDateTime.now()
        ).getSeconds();

        new Thread(() -> {
            try {
                Thread.sleep(5000);
                activeCalls.remove(callId);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();

        return ResponseEntity.ok(Map.of(
            "success", true,
            "status", "ENDED",
            "duration", durationSeconds,
            "message", "Call ended"
        ));
    }

    /**
     * Decline an incoming call
     */
    @PostMapping("/{callId}/decline")
    public ResponseEntity<?> declineCall(
            @PathVariable String callId,
            @RequestParam String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertActorIsSelf(authUser, userId);
        UUID actorId = ConnectSecurity.requireUserId(authUser);
        CallSession session = requireCallSession(callId);
        assertCanActOnCall(authUser, session);

        broadcastCallHangup(session, actorId, "declined");
        activeCalls.remove(callId);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Call declined"
        ));
    }

    public static class CallActionRequest {
        public String callId;
        public String userId;
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptCallAlias(
            @Valid @RequestBody CallActionRequest req,
            @AuthenticationPrincipal AuthUser authUser) {
        if (req == null || req.callId == null || req.userId == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "callId and userId are required"
            ));
        }
        return answerCall(req.callId, req.userId, authUser);
    }

    @PostMapping("/reject")
    public ResponseEntity<?> rejectCallAlias(
            @Valid @RequestBody CallActionRequest req,
            @AuthenticationPrincipal AuthUser authUser) {
        if (req == null || req.callId == null || req.userId == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "callId and userId are required"
            ));
        }
        return declineCall(req.callId, req.userId, authUser);
    }

    /**
     * Get call status
     */
    @GetMapping("/{callId}/status")
    public ResponseEntity<?> getCallStatus(
            @PathVariable String callId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.requireUserId(authUser);
        CallSession session;
        try {
            session = requireCallSession(callId);
            assertCanActOnCall(authUser, session);
        } catch (ResponseStatusException ex) {
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                return ResponseEntity.ok(Map.of(
                    "status", "NOT_FOUND",
                    "message", "Call not found or has ended"
                ));
            }
            throw ex;
        }

        return ResponseEntity.ok(Map.of(
            "callId", session.id,
            "status", session.status,
            "callType", session.callType,
            "participants", session.participants,
            "startTime", session.startTime.toString()
        ));
    }

    /**
     * Get active calls for a user
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveCalls(
            @RequestParam String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertQueryUserIsSelf(authUser, userId);

        List<Map<String, Object>> userCalls = new ArrayList<>();

        for (CallSession c : activeCalls.values()) {
            if ((c.participants.contains(userId) || c.callerId.equals(userId))
                && !"ENDED".equals(c.status)) {
                userCalls.add(Map.of(
                        "callId", c.id,
                        "conversationId", c.conversationId,
                        "callerId", c.callerId,
                        "callType", c.callType,
                        "status", c.status,
                        "startTime", c.startTime.toString()
                ));
            }
        }

        return ResponseEntity.ok(userCalls);
    }

    /**
     * Get call history
     */
    @GetMapping("/history")
    public ResponseEntity<?> getCallHistory(
            @RequestParam String userId,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertQueryUserIsSelf(authUser, userId);

        List<Map<String, Object>> history = new ArrayList<>();
        int count = 0;

        for (CallSession c : activeCalls.values()) {
            if (count >= limit) break;

            if ((c.participants.contains(userId) || c.callerId.equals(userId))
                && "ENDED".equals(c.status)) {

                long duration = c.endTime != null ?
                    Duration.between(c.startTime, c.endTime).getSeconds() : 0;

                history.add(Map.of(
                    "callId", c.id,
                    "callType", c.callType,
                    "status", c.status,
                    "startTime", c.startTime.toString(),
                    "endTime", c.endTime != null ? c.endTime.toString() : "",
                    "duration", duration
                ));
                count++;
            }
        }

        return ResponseEntity.ok(history);
    }
}
