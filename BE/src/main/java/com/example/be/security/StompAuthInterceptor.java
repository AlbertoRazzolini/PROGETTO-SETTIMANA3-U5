package com.example.be.security;

import com.example.be.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Sicurezza dei messaggi STOMP in ingresso.
 * Il browser non puo' mettere header custom nell'handshake WebSocket, quindi il JWT viaggia
 * nel frame CONNECT (header "Authorization: Bearer ..."), come nelle chiamate REST.
 *  - CONNECT senza token valido -> rifiutato
 *  - SUBSCRIBE consentito solo alle proprie code personali (/user/queue/...)
 *  - SEND dal client non previsto (le notifiche vanno solo dal server al client) -> rifiutato
 */
@Component
@RequiredArgsConstructor
public class StompAuthInterceptor implements ChannelInterceptor {

    private static final String PREFISSO = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }
        StompCommand comando = accessor.getCommand();

        if (StompCommand.CONNECT.equals(comando)) {
            String header = accessor.getFirstNativeHeader("Authorization");
            if (header == null || !header.startsWith(PREFISSO)) {
                throw new MessageDeliveryException("Autenticazione richiesta");
            }
            var user = jwtService.estraiUserId(header.substring(PREFISSO.length()))
                    .flatMap(userRepository::findById)
                    .orElseThrow(() -> new MessageDeliveryException("Token non valido"));
            UtenteAutenticato principal = new UtenteAutenticato(user.getId(), user.getRuolo());
            accessor.setUser(new UsernamePasswordAuthenticationToken(principal, null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRuolo().name()))));
        } else if (StompCommand.SUBSCRIBE.equals(comando)) {
            String destinazione = accessor.getDestination();
            // "/user/queue/..." viene risolta da Spring sulla coda del SOLO utente collegato:
            // non si puo' ascoltare la coda di un altro
            if (accessor.getUser() == null || destinazione == null || !destinazione.startsWith("/user/queue/")) {
                throw new MessageDeliveryException("Sottoscrizione non consentita");
            }
        } else if (StompCommand.SEND.equals(comando)) {
            throw new MessageDeliveryException("Invio di messaggi non consentito");
        }
        return message;
    }
}
