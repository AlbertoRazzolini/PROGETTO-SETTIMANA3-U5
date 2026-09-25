package com.example.be.exceptions;

import org.springframework.web.client.RestClientResponseException;

/**
 * Descrizione di un errore esterno adatta ai log.
 * Il messaggio delle eccezioni di SMTP e dei client HTTP puo' contenere dati personali:
 * il server di posta spesso ripete l'indirizzo del destinatario ("550 ... nome@dominio"),
 * e il corpo delle risposte di auto.dev include il blocco "user" con l'email dell'account.
 * Per questo nei log finiscono solo il tipo di errore e, per le risposte HTTP, lo status: mai il testo.
 */
public final class ErroriPerLog {

    private ErroriPerLog() {
    }

    public static String descrivi(Throwable errore) {
        if (errore == null) {
            return "errore sconosciuto";
        }
        if (errore instanceof RestClientResponseException r) {
            return errore.getClass().getSimpleName() + " (HTTP " + r.getStatusCode().value() + ")";
        }
        return errore.getClass().getSimpleName();
    }
}
