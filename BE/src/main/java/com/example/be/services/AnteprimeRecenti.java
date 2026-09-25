package com.example.be.services;

import com.example.be.dto.autodev.AnteprimaAnnuncioDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Memoria breve delle anteprime di auto.dev.
 * Il flusso tipico dell'admin e' "anteprima -> importa": senza questa memoria l'import rifarebbe
 * le stesse 2 chiamate (listing + foto) appena fatte per l'anteprima. Le voci scadono dopo poco,
 * cosi' prezzo e foto importati non sono mai piu' vecchi di qualche minuto.
 * Solo in memoria: basta per una singola istanza del backend (come il broker WebSocket).
 */
@Component
public class AnteprimeRecenti {

    private record Voce(AnteprimaAnnuncioDto anteprima, Instant scadenza) {
    }

    private final Map<String, Voce> voci = new ConcurrentHashMap<>();
    private final Duration durata;
    private final int massimo;
    private final Clock clock;

    // Due costruttori: @Autowired indica a Spring quale usare
    @Autowired
    public AnteprimeRecenti(@Value("${app.autodev.anteprima-durata:PT30M}") Duration durata,
                            @Value("${app.autodev.anteprima-max:100}") int massimo) {
        this(durata, massimo, Clock.systemUTC());
    }

    // Costruttore per i test: orologio controllabile
    AnteprimeRecenti(Duration durata, int massimo, Clock clock) {
        this.durata = durata;
        this.massimo = massimo;
        this.clock = clock;
    }

    public Optional<AnteprimaAnnuncioDto> trova(String listingId) {
        String chiave = chiave(listingId);
        Voce voce = voci.get(chiave);
        if (voce == null) {
            return Optional.empty();
        }
        if (!voce.scadenza().isAfter(clock.instant())) {
            voci.remove(chiave, voce);
            return Optional.empty();
        }
        return Optional.of(voce.anteprima());
    }

    public void salva(String listingId, AnteprimaAnnuncioDto anteprima) {
        Instant adesso = clock.instant();
        if (voci.size() >= massimo) {
            // Prima le scadute; se non basta, la piu' vicina alla scadenza (la piu' vecchia)
            voci.values().removeIf(v -> !v.scadenza().isAfter(adesso));
            if (voci.size() >= massimo) {
                voci.entrySet().stream()
                        .min(Comparator.comparing(e -> e.getValue().scadenza()))
                        .ifPresent(e -> voci.remove(e.getKey(), e.getValue()));
            }
        }
        voci.put(chiave(listingId), new Voce(anteprima, adesso.plus(durata)));
    }

    public void rimuovi(String listingId) {
        voci.remove(chiave(listingId));
    }

    // Il Listing ID arriva sia maiuscolo (import) sia come digitato (anteprima): chiave unica
    private static String chiave(String listingId) {
        return listingId.trim().toUpperCase(Locale.ROOT);
    }
}
