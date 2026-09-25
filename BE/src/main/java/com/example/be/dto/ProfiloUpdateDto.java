package com.example.be.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Modifica profilo: solo nome e cognome. Email, ruolo e password non si cambiano da qui
// (eventuali campi extra nel body vengono ignorati).
public record ProfiloUpdateDto(

        @NotBlank(message = "Il nome e' obbligatorio")
        @Size(max = 50, message = "Il nome puo' avere al massimo 50 caratteri")
        @Pattern(regexp = Validazione.NOME_REGEX, message = "Il nome contiene caratteri non ammessi")
        String nome,

        @NotBlank(message = "Il cognome e' obbligatorio")
        @Size(max = 50, message = "Il cognome puo' avere al massimo 50 caratteri")
        @Pattern(regexp = Validazione.NOME_REGEX, message = "Il cognome contiene caratteri non ammessi")
        String cognome
) {
}
