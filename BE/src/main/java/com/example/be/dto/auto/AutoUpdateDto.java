package com.example.be.dto.auto;

import com.example.be.enums.StatoAuto;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

// PUT: sostituisce tutti i campi modificabili dall'admin.
// I dati tecnici (marca, modello, scheda, foto...) arrivano da auto.dev e non si modificano.
public record AutoUpdateDto(

        @NotNull(message = "Il chilometraggio e' obbligatorio")
        @Min(value = 0, message = "Il chilometraggio non puo' essere negativo")
        @Max(value = 999_999, message = "Il chilometraggio puo' avere al massimo 6 cifre")
        Integer km,

        @NotNull(message = "Il prezzo e' obbligatorio")
        @DecimalMin(value = "0.01", message = "Il prezzo deve essere maggiore di zero")
        @Digits(integer = 7, fraction = 2, message = "Prezzo non valido (max 7 cifre intere e 2 decimali)")
        BigDecimal prezzo,

        @NotNull(message = "Lo stato e' obbligatorio")
        StatoAuto stato,

        // Testo semplice: nel frontend viene mostrato come testo, mai interpretato come HTML
        @NotBlank(message = "La descrizione e' obbligatoria")
        @Size(max = 5000, message = "La descrizione puo' avere al massimo 5000 caratteri")
        String descrizione
) {
}
