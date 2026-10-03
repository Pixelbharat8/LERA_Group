package com.lera.connect_service.config;

import com.lera.connect_service.security.StompChannelSecurityInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket Configuration for real-time messaging
 * Similar to Telegram, WeChat, Teams - all use WebSocket for instant delivery
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompChannelSecurityInterceptor stompChannelSecurityInterceptor;

    /**
     * Shares `lera.cors.allowed-origins` with SecurityConfig, which gates HTTP CORS. This list
     * used to be hard-coded here, so deploying on a domain outside *.leraacademy.edu.vn and
     * setting CORS_ALLOWED_ORIGINS fixed the REST calls and silently left the WebSocket
     * handshake origin-blocked — the one failure mode where chat falls back to polling and
     * looks fine while call signalling is dead. The default is identical to SecurityConfig's.
     */
    @Value("${lera.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000,capacitor://localhost,ionic://localhost,https://*.leraacademy.edu.vn}")
    private String allowedOrigins;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompChannelSecurityInterceptor);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker
        // /topic - for broadcast messages (announcements, group messages)
        // /queue - for private messages (1-on-1 chat)
        // /user - for user-specific messages
        config.enableSimpleBroker("/topic", "/queue", "/user");
        
        // Prefix for messages FROM client TO server
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefix for user-specific messages
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = java.util.Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(o -> !o.isEmpty())
                .toArray(String[]::new);
        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns(origins)
                .withSockJS();

        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns(origins);
    }
}

