package com.example.be.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// DTO di registrazione: contiene SOLO i campi che il client puo' decidere.
// Se il body contiene anche "ruolo", "id" o altro, quei campi vengono semplicemente ignorati:
// il ruolo lo decide il server (sempre USER).
public record RegisterRequestDto(

        @NotBlank(message = "Il nome e' obbligatorio")
        @Size(max = 50, message = "Il nome puo' avere al massimo 50 caratteri")
        @Pattern(regexp = Validazione.NOME_REGEX, message = "Il nome contiene caratteri non ammessi")
        String nome,

        @NotBlank(message = "Il cognome e' obbligatorio")
        @Size(max = 50, message = "Il cognome puo' avere al massimo 50 caratteri")
        @Pattern(regexp = Validazione.NOME_REGEX, message = "Il cognome contiene caratteri non ammessi")
        String cognome,

        @NotBlank(message = "L'email e' obbligatoria")
        @Email(message = "Formato email non valido")
        @Size(max = 255, message = "L'email e' troppo lunga")
        String email,

        // Max 72: BCrypt considera solo i primi 72 byte, oltre verrebbero ignorati in silenzio
        @NotBlank(message = "La password e' obbligatoria")
        @Size(min = 8, max = 72, message = "La password deve avere tra 8 e 72 caratteri")
        @Pattern(regexp = Validazione.PASSWORD_REGEX, message = "La password deve contenere almeno una lettera e un numero")
        String password
) {
}
