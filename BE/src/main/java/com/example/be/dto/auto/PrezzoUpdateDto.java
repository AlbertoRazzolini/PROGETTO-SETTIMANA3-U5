package com.example.be.dto.auto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PrezzoUpdateDto(
        @NotNull(message = "Il prezzo e' obbligatorio")
        @DecimalMin(value = "0.01", message = "Il prezzo deve essere maggiore di zero")
        @Digits(integer = 7, fraction = 2, message = "Prezzo non valido (max 7 cifre intere e 2 decimali)")
        BigDecimal prezzo
) {
}
