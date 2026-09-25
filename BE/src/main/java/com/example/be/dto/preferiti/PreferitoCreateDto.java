package com.example.be.dto.preferiti;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

// Solo l'auto: l'utente proprietario lo decide il server dal token (un "userId" nel body viene ignorato)
public record PreferitoCreateDto(
        @NotNull(message = "L'auto e' obbligatoria")
        UUID autoId
) {
}
