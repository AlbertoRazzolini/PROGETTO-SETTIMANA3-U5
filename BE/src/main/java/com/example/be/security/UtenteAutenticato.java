package com.example.be.security;

import com.example.be.enums.Ruolo;

import java.security.Principal;
import java.util.UUID;

// Principal messo nel SecurityContext dal filtro JWT (HTTP) e nella sessione WebSocket (STOMP).
// Contiene solo id e ruolo: niente email ne' password circolano nel contesto di sicurezza.
// Nei controller si ottiene con @AuthenticationPrincipal UtenteAutenticato utente.
public record UtenteAutenticato(UUID id, Ruolo ruolo) implements Principal {

    // Il "nome" del principal e' l'id: e' la chiave con cui Spring instrada i messaggi
    // WebSocket verso l'utente giusto (convertAndSendToUser(id, ...) -> /user/queue/...)
    @Override
    public String getName() {
        return id.toString();
    }
}
