package com.example.be.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

// Formato unico di tutte le risposte di errore dell'API.
// "campi" compare solo per gli errori di validazione (campo -> messaggio).
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponseDto(
        Instant timestamp,
        int status,
        String errore,
        String messaggio,
        Map<String, String> campi
) {
    public ErrorResponseDto(int status, String errore, String messaggio) {
        this(Instant.now(), status, errore, messaggio, null);
    }

    public ErrorResponseDto(int status, String errore, String messaggio, Map<String, String> campi) {
        this(Instant.now(), status, errore, messaggio, campi);
    }
}
