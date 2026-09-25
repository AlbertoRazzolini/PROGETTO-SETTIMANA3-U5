package com.example.be.security;

import com.example.be.dto.ErrorResponseDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

// Errori sollevati dai filtri di Spring Security (prima di arrivare ai controller, quindi
// fuori dal GlobalExceptionHandler): stesse risposte JSON del resto dell'API.
@Component
@RequiredArgsConstructor
public class JsonSecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    // 401: nessun token o token non valido/scaduto
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException ex) throws IOException {
        scrivi(response, HttpStatus.UNAUTHORIZED, "Autenticazione richiesta");
    }

    // 403: autenticato ma senza il ruolo richiesto (es. USER che prova a cambiare un prezzo)
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException ex) throws IOException {
        scrivi(response, HttpStatus.FORBIDDEN, "Non hai i permessi per questa operazione");
    }

    private void scrivi(HttpServletResponse response, HttpStatus status, String messaggio) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getOutputStream(),
                new ErrorResponseDto(status.value(), status.getReasonPhrase(), messaggio));
    }
}
