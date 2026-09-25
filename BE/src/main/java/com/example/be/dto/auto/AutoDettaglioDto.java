package com.example.be.dto.auto;

import com.example.be.enums.StatoAuto;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

// Pagina di dettaglio pubblica: niente dati interni (listing ID auto.dev, stato di pubblicazione)
public record AutoDettaglioDto(
        UUID id,
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
        Instant createdAt
) {
}
