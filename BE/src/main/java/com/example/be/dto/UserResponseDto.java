package com.example.be.dto;

import com.example.be.entities.User;
import com.example.be.enums.Ruolo;

import java.time.Instant;
import java.util.UUID;

// Mai restituire l'entita' User: la password (anche se hashata) non deve uscire dal server
public record UserResponseDto(
        UUID id,
        String nome,
        String cognome,
        String email,
        Ruolo ruolo,
        Instant createdAt
) {
    public static UserResponseDto from(User user) {
        return new UserResponseDto(user.getId(), user.getNome(), user.getCognome(),
                user.getEmail(), user.getRuolo(), user.getCreatedAt());
    }
}
