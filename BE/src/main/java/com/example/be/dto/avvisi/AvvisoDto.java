package com.example.be.dto.avvisi;

import com.example.be.dto.auto.AutoCardDto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

// Il token di disattivazione NON compare mai nelle risposte: viaggia solo nel link della mail
public record AvvisoDto(
        UUID id,
        UUID preferitoId,
        BigDecimal soglia,
        boolean attivo,
        // true se per la soglia attuale la mail e' gia' stata inviata
        boolean notificato,
        Instant createdAt,
        Instant updatedAt,
        AutoCardDto auto
) {
}
