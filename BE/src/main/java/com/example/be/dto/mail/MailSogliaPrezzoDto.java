package com.example.be.dto.mail;

import java.math.BigDecimal;
import java.util.UUID;

// Dati interni per la mail "prezzo sotto soglia" (non arriva mai dal client)
public record MailSogliaPrezzoDto(
        UUID avvisoId,
        String destinatario,
        String nome,
        UUID autoId,
        String marca,
        String modello,
        BigDecimal prezzo,
        BigDecimal soglia,
        String tokenDisattivazione
) {
}
