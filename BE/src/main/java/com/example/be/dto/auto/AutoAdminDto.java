package com.example.be.dto.auto;

import com.example.be.enums.StatoAuto;
import com.example.be.enums.StatoPubblicazione;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

// Vista completa di un annuncio per l'admin (include lo stato di pubblicazione e le bozze)
public record AutoAdminDto(
        UUID id,
        String listingId,
        String vin,
        String marca,
        String modello,
        Integer anno,
        String carburante,
        String descrizione,
        JsonNode schedaTecnica,
        List<String> immagini,
        Integer km,
        BigDecimal prezzo,
        StatoAuto stato,
        StatoPubblicazione statoPubblicazione,
        Instant createdAt,
        Instant updatedAt
) {
}
