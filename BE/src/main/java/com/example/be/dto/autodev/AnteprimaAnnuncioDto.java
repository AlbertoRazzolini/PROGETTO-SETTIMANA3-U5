package com.example.be.dto.autodev;

import com.example.be.enums.StatoAuto;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.util.List;

// Annuncio auto.dev gia' "localizzato": prezzo in euro, km, carburante e descrizione in italiano.
// E' esattamente cio' che verra' salvato all'import (l'admin poi puo' correggere prezzo, km, stato e descrizione).
public record AnteprimaAnnuncioDto(
        String listingId,
        String vin,
        String marca,
        String modello,
        Integer anno,
        String carburante,
        BigDecimal prezzoUsd,
        BigDecimal prezzoEur,
        Integer km,
        StatoAuto statoSuggerito,
        String venditore,
        String descrizione,
        JsonNode schedaTecnica,
        List<String> foto
) {
}
