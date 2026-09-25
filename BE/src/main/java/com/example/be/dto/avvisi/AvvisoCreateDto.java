package com.example.be.dto.avvisi;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

// La soglia si imposta su un preferito dell'utente: niente userId, attivo, inviato... nel DTO,
// quindi se il client li aggiunge al body vengono ignorati
public record AvvisoCreateDto(
        @NotNull(message = "Il preferito e' obbligatorio")
        UUID preferitoId,

        @NotNull(message = "La soglia e' obbligatoria")
        @DecimalMin(value = "0.01", message = "La soglia deve essere maggiore di zero")
        @Digits(integer = 7, fraction = 2, message = "Soglia non valida (max 7 cifre intere e 2 decimali)")
        BigDecimal soglia
) {
}
