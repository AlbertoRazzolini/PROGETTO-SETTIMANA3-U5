package com.example.be.security;

import com.example.be.entities.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey chiave;
    private final long durataMs;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration}") long durataMs) {
        // HS256 richiede almeno 256 bit: Keys.hmacShaKeyFor lancia eccezione se il secret e' troppo corto
        this.chiave = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.durataMs = durataMs;
    }

    // Nel token solo i dati che servono: id utente (subject) e ruolo (utile al FE per mostrare le sezioni admin).
    // Niente email, nome o altri dati personali.
    public String generaToken(User user) {
        Date adesso = new Date();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("ruolo", user.getRuolo().name())
                .issuedAt(adesso)
                .expiration(new Date(adesso.getTime() + durataMs))
                .signWith(chiave)
                .compact();
    }

    // Restituisce l'id utente se il token e' valido (firma corretta e non scaduto), altrimenti vuoto
    public Optional<UUID> estraiUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(chiave)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(UUID.fromString(claims.getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
