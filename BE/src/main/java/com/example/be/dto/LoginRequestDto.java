package com.example.be.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequestDto(

        @NotBlank(message = "L'email e' obbligatoria")
        @Size(max = 255)
        String email,

        @NotBlank(message = "La password e' obbligatoria")
        @Size(max = 72)
        String password
) {
}
