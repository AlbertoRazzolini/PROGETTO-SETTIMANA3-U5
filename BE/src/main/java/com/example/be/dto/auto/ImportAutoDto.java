package com.example.be.dto.auto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ImportAutoDto(
        @NotBlank(message = "Il listing ID e' obbligatorio")
        @Pattern(regexp = "^[A-Za-z0-9]{5,32}$", message = "Listing ID non valido")
        String listingId
) {
}
