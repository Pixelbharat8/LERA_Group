package com.lera.connect_service.config;

import com.lera.connect_service.security.StompChannelSecurityInterceptor;
import lombok.RequiredArgsConstructor;
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
        String[] origins = {
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "capacitor://localhost",
                "ionic://localhost",
                "https://*.leraacademy.edu.vn"
        };
        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns(origins)
                .withSockJS();

        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns(origins);
    }
}

