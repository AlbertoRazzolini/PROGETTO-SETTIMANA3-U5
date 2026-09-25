package com.example.be.dto;

// Regole di validazione condivise tra piu' DTO
public final class Validazione {

    // Solo lettere (anche accentate), spazi, apostrofi e trattini; deve iniziare con una lettera.
    // Nome e cognome finiscono anche nelle mail.
    public static final String NOME_REGEX = "^[\\p{L}][\\p{L} '\\-]*$";

    // Almeno una lettera e un numero
    public static final String PASSWORD_REGEX = "^(?=.*[A-Za-z])(?=.*\\d).+$";

    private Validazione() {
    }
}
