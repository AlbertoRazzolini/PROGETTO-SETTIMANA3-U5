package com.example.be.dto.auto;

import com.example.be.enums.StatoAuto;
import jakarta.validation.constraints.*;

// PUT: sostituisce i dati descrittivi dell'annuncio (km, stato, descrizione).
// Il prezzo NON e' qui: si cambia solo con PATCH /prezzo, l'unica modifica che fa scattare gli avvisi.
// Un "prezzo" aggiunto al body viene ignorato, come ogni altro campo extra.
// I dati tecnici (marca, modello, scheda, foto...) arrivano da auto.dev e non si modificano.
public record AutoUpdateDto(
        @NotNull(message = "Il chilometraggio e' obbligatorio")
        @Min(value = 0, message = "Il chilometraggio non puo' essere negativo")
        @Max(value = 999_999, message = "Il chilometraggio puo' avere al massimo 6 cifre")
        Integer km,

        @NotNull(message = "Lo stato e' obbligatorio")
        StatoAuto stato,

        // Testo semplice: nel frontend viene mostrato come testo, mai interpretato come HTML
        @NotBlank(message = "La descrizione e' obbligatoria")
        @Size(max = 5000, message = "La descrizione puo' avere al massimo 5000 caratteri")
        String descrizione
) {
}
