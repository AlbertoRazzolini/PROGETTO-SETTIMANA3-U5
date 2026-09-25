package com.example.be.dto;

public record LoginResponseDto(
        String token,
        UserResponseDto utente
) {
}
