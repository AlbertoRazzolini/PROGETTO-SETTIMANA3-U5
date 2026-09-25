package com.example.be.dto.autodev;

import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.util.List;

// Oggetto unico che unisce le due risposte di auto.dev, con i dati ancora "grezzi"
// (prezzo in dollari, miglia, testi in inglese):
//  - GET /listings/{id} -> retailListing (prezzo, venditore, descrizione) + vehicle (scheda tecnica, carburante, VIN)
//  - GET /photos/{vin}  -> galleria fotografica
public record AnnuncioAutoDevDto(
        String listingId,
        String vin,
        String marca,
        String modello,
        Integer anno,
        String carburante,
        BigDecimal prezzoUsd,
        Integer miglia,
        Boolean usato,
        String venditore,
        String descrizione,
        JsonNode schedaTecnica,
        List<String> foto
) {
}
