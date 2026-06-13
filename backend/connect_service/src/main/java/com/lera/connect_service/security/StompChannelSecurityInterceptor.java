package com.lera.connect_service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Inbound STOMP security: authenticated sessions only, and conversation-scoped
 * {@code /app|/topic}/(chat|typing|read|reaction|webrtc)/{conversationId} destinations.
 */
@Component
@RequiredArgsConstructor
public class StompChannelSecurityInterceptor implements ChannelInterceptor {

    private static final Pattern CONVERSATION_DESTINATION = Pattern.compile(
            "^/(?:app|topic)/(?:chat|typing|read|reaction|webrtc)/([0-9a-fA-F-]{36})$");

    private final ChatAuthorizationService chatAuthorizationService;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        installSecurityContext(accessor);

        StompCommand cmd = accessor.getCommand();
        if (cmd == null) {
            return message;
        }

        if (cmd == StompCommand.CONNECTED || cmd == StompCommand.RECEIPT || cmd == StompCommand.ERROR) {
            return message;
        }

        if (cmd == StompCommand.CONNECT || cmd == StompCommand.MESSAGE || cmd == StompCommand.SUBSCRIBE) {
            requireAuthenticated(accessor);
        }

        if (cmd == StompCommand.MESSAGE || cmd == StompCommand.SUBSCRIBE) {
            String destination = accessor.getDestination();
            extractConversationId(destination).ifPresent(convId -> {
                AuthUser user = requireAuthUser();
                chatAuthorizationService.requireParticipantConversation(user, convId);
            });
        }

        return message;
    }

    private static void installSecurityContext(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user instanceof Authentication auth) {
            SecurityContextHolder.getContext().setAuthentication(auth);
            return;
        }
        Object simpUser = accessor.getHeader(SimpMessageHeaderAccessor.USER_HEADER);
        if (simpUser instanceof Authentication auth) {
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
    }

    private static void requireAuthenticated(StompHeaderAccessor accessor) {
        if (resolveAuthentication(accessor) == null) {
            throw new AccessDeniedException("Authenticated WebSocket session required");
        }
    }

    private static AuthUser requireAuthUser() {
        return CurrentUser.get()
                .orElseThrow(() -> new AccessDeniedException("Authenticated WebSocket session required"));
    }

    private static Authentication resolveAuthentication(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user instanceof Authentication auth) {
            if (auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
                return auth;
            }
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            return auth;
        }
        return null;
    }

    static Optional<String> extractConversationId(String destination) {
        if (destination == null || destination.isBlank()) {
            return Optional.empty();
        }
        Matcher matcher = CONVERSATION_DESTINATION.matcher(destination.trim());
        if (matcher.matches()) {
            return Optional.of(matcher.group(1));
        }
        return Optional.empty();
    }
}
