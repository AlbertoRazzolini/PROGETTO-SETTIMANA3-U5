package com.example.be.security;

import com.example.be.repositories.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String PREFISSO = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        // Nessun token o token non valido: la richiesta prosegue da anonima.
        // Se l'endpoint e' protetto, sara' l'entry point a rispondere 401.
        if (header != null && header.startsWith(PREFISSO)) {
            String token = header.substring(PREFISSO.length());
            jwtService.estraiUserId(token)
                    // Il ruolo si rilegge dal DB a ogni richiesta: se il super-admin lo cambia,
                    // vale subito, senza aspettare la scadenza del token (1 settimana).
                    .flatMap(userRepository::findById)
                    .ifPresent(user -> {
                        UtenteAutenticato principal = new UtenteAutenticato(user.getId(), user.getRuolo());
                        var auth = new UsernamePasswordAuthenticationToken(
                                principal, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRuolo().name())));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    });
        }

        chain.doFilter(request, response);
    }
}
