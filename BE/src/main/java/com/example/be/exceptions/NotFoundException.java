package com.example.be.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// Usata anche quando la risorsa esiste ma appartiene a un altro utente:
// chi prova l'id di un altro non deve nemmeno sapere che esiste.
@ResponseStatus(HttpStatus.NOT_FOUND)
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
