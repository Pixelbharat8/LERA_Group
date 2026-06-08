package com.lera.connect_service.controller;

import com.lera.connect_service.entity.OutboundMessage;
import com.lera.connect_service.repository.OutboundMessageRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.messaging.OutboundMessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Outbound messaging (Zalo / SMS) for the CRM. Sends via the configured provider, or records
 * SKIPPED until credentials are added — so follow-ups and automations can call it today.
 */
@RestController
@RequestMapping("/api/messaging")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','STAFF')")
public class MessagingController {

    private final OutboundMessagingService messagingService;
    private final OutboundMessageRepository messageRepository;

    /** Which channels are live (Zalo/SMS configured?). */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> status() {
        return ResponseEntity.ok(messagingService.channelStatus());
    }

    @PostMapping("/send")
    public ResponseEntity<OutboundMessage> send(@RequestBody Map<String, Object> body,
                                                @AuthenticationPrincipal AuthUser authUser) {
        String channel = str(body.get("channel"));
        String message = str(body.get("body"));
        if (channel == null || message == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "channel and body are required");
        }
        UUID leadId = uuid(body.get("leadId"));
        String toPhone = str(body.get("toPhone"));
        UUID sentBy = ConnectSecurity.requireUserId(authUser);
        return ResponseEntity.ok(messagingService.send(leadId, toPhone, channel, message, sentBy));
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<OutboundMessage>> byLead(@PathVariable UUID leadId) {
        return ResponseEntity.ok(messageRepository.findByLeadIdOrderByCreatedAtDesc(leadId));
    }

    private static String str(Object o) { return o != null && !o.toString().isBlank() ? o.toString() : null; }
    private static UUID uuid(Object o) {
        if (o == null) return null;
        try { return UUID.fromString(o.toString()); } catch (IllegalArgumentException e) { return null; }
    }
}
