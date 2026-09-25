package com.example.be.config;

import com.example.be.security.StompAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Notifiche in tempo reale via WebSocket + STOMP.
 * Il frontend si collega a ws://localhost:8080/ws, manda il JWT nel frame CONNECT
 * e si iscrive a /user/queue/notifiche per ricevere le proprie notifiche.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthInterceptor stompAuthInterceptor;

    @Value("${app.cors.allowed-origin}")
    private String allowedOrigin;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Stessa origine ammessa del CORS REST: altri siti non possono aprire la connessione
        registry.addEndpoint("/ws").setAllowedOrigins(allowedOrigin);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Broker in memoria: sufficiente per una singola istanza del backend
        registry.enableSimpleBroker("/queue");
        registry.setUserDestinationPrefix("/user");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthInterceptor);
    }
}
