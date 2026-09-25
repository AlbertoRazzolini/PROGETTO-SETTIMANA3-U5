package com.example.be.services;

import com.example.be.dto.autodev.AnteprimaAnnuncioDto;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AnteprimeRecentiTest {

    // Orologio fermo che il test fa avanzare a mano
    private static final class OrologioManuale extends Clock {
        private Instant adesso = Instant.parse("2026-09-25T10:00:00Z");

        void avanza(Duration d) {
            adesso = adesso.plus(d);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return adesso;
        }
    }

    private static AnteprimaAnnuncioDto anteprima(String listingId) {
        return new AnteprimaAnnuncioDto(listingId, "VIN" + listingId, "Subaru", "Outback", 2025, "Benzina",
                null, null, 1000, null, null, "descrizione", null, List.of());
    }

    @Test
    void riusaLAnteprimaFinoAllaScadenza() {
        OrologioManuale orologio = new OrologioManuale();
        AnteprimeRecenti memoria = new AnteprimeRecenti(Duration.ofMinutes(30), 100, orologio);
        memoria.salva("abc123", anteprima("ABC123"));

        orologio.avanza(Duration.ofMinutes(29));
        assertTrue(memoria.trova("ABC123").isPresent(), "stessa chiave anche con maiuscole diverse");

        orologio.avanza(Duration.ofMinutes(1));
        assertTrue(memoria.trova("abc123").isEmpty(), "scaduta dopo 30 minuti");
    }

    @Test
    void rimuoviDopoLImport() {
        AnteprimeRecenti memoria = new AnteprimeRecenti(Duration.ofMinutes(30), 100, new OrologioManuale());
        memoria.salva("ABC123", anteprima("ABC123"));
        memoria.rimuovi("abc123");
        assertTrue(memoria.trova("ABC123").isEmpty());
    }

    @Test
    void oltreIlMassimoEliminaLaPiuVecchia() {
        OrologioManuale orologio = new OrologioManuale();
        AnteprimeRecenti memoria = new AnteprimeRecenti(Duration.ofMinutes(30), 2, orologio);
        memoria.salva("PRIMA1", anteprima("PRIMA1"));
        orologio.avanza(Duration.ofMinutes(1));
        memoria.salva("SECONDA", anteprima("SECONDA"));
        orologio.avanza(Duration.ofMinutes(1));
        memoria.salva("TERZA1", anteprima("TERZA1"));

        assertTrue(memoria.trova("PRIMA1").isEmpty());
        assertTrue(memoria.trova("SECONDA").isPresent());
        assertTrue(memoria.trova("TERZA1").isPresent());
    }
}
