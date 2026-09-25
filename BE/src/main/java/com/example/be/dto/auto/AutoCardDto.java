package com.example.be.dto.auto;

import com.example.be.enums.StatoAuto;

import java.math.BigDecimal;
import java.util.UUID;

// Riga della vetrina (dati essenziali per la card)
public record AutoCardDto(
        UUID id,
        String marca,
        String modello,
        Integer anno,
        String carburante,
        Integer km,
        BigDecimal prezzo,
        StatoAuto stato,
        String immaginePrincipale
) {
}
