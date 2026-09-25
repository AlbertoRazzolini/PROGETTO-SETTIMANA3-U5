package com.example.be.exceptions;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailSendException;
import org.springframework.web.client.HttpClientErrorException;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

// Nei log non devono finire indirizzi email, nemmeno quando arrivano dentro il messaggio di un errore esterno
class ErroriPerLogTest {

    @Test
    void erroreSmtpSenzaIndirizzo() {
        String descrizione = ErroriPerLog.descrivi(new MailSendException("550 5.1.1 mario.rossi@example.com: user unknown"));
        assertEquals("MailSendException", descrizione);
        assertFalse(descrizione.contains("@"));
    }

    @Test
    void rispostaHttpSoloConLoStatus() {
        byte[] corpo = "{\"user\":{\"email\":\"account@example.com\"}}".getBytes(StandardCharsets.UTF_8);
        HttpClientErrorException errore = HttpClientErrorException.create(
                HttpStatus.NOT_FOUND, "Not Found", HttpHeaders.EMPTY, corpo, StandardCharsets.UTF_8);

        String descrizione = ErroriPerLog.descrivi(errore);
        assertTrue(descrizione.contains("HTTP 404"));
        assertFalse(descrizione.contains("@"));
    }

    @Test
    void nessunErrore() {
        assertEquals("errore sconosciuto", ErroriPerLog.descrivi(null));
    }
}
