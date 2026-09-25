package com.example.be.dto.autodev;

import java.math.BigDecimal;

// Riga della ricerca generica GET /listings (dati essenziali per scegliere quale annuncio importare)
public record AnnuncioAutoDevRiassuntoDto(
        String listingId,
        String marca,
        String modello,
        Integer anno,
        String carburante,
        BigDecimal prezzoUsd,
        Integer miglia,
        Boolean usato,
        String immaginePrincipale
) {
}
