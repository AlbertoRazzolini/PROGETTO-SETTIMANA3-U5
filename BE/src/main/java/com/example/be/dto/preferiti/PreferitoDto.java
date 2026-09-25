package com.example.be.dto.preferiti;

import com.example.be.dto.auto.AutoCardDto;

import java.time.Instant;
import java.util.UUID;

// "disponibile" = false se l'admin ha rimesso l'annuncio in bozza dopo che l'utente l'aveva salvato
public record PreferitoDto(
        UUID id,
        Instant createdAt,
        boolean disponibile,
        AutoCardDto auto
) {
}
