package com.example.be.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CambioPasswordDto(

        // Richiesta per confermare che chi cambia la password e' davvero il titolare dell'account
        @NotBlank(message = "La password attuale e' obbligatoria")
        @Size(max = 72)
        String passwordAttuale,

        @NotBlank(message = "La nuova password e' obbligatoria")
        @Size(min = 8, max = 72, message = "La password deve avere tra 8 e 72 caratteri")
        @Pattern(regexp = Validazione.PASSWORD_REGEX, message = "La password deve contenere almeno una lettera e un numero")
        String nuovaPassword
) {
}
