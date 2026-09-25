package com.example.be.dto;

import com.example.be.enums.Ruolo;
import jakarta.validation.constraints.NotNull;

public record RuoloUpdateDto(
        @NotNull(message = "Il ruolo e' obbligatorio")
        Ruolo ruolo
) {
}
