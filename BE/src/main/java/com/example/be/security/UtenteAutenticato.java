package com.example.be.security;

import com.example.be.enums.Ruolo;

import java.util.UUID;

// Principal messo nel SecurityContext dal filtro JWT.
// Contiene solo id e ruolo: niente email ne' password circolano nel contesto di sicurezza.
// Nei controller si ottiene con @AuthenticationPrincipal UtenteAutenticato utente.
public record UtenteAutenticato(UUID id, Ruolo ruolo) {
}
