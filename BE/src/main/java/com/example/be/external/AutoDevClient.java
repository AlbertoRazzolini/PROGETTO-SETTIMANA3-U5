package com.example.be.external;

import com.example.be.dto.autodev.AnnuncioAutoDevDto;
import com.example.be.dto.autodev.AnnuncioAutoDevRiassuntoDto;
import com.example.be.exceptions.ExternalApiException;
import com.example.be.exceptions.NotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;

// Client per le API di auto.dev.
// NB: ogni risposta di auto.dev contiene anche un blocco "user" con i dati dell'account
// (nome, email, IP...): viene sempre scartato, si legge solo "data".
@Slf4j
@Component
public class AutoDevClient {

    // Campi in cui puo' trovarsi la descrizione del venditore dentro retailListing
    // (nel piano Free spesso non c'e' nessuno di questi campi)
    private static final List<String> CAMPI_DESCRIZIONE = List.of("description", "sellerComments", "dealerComments", "comments");

    private final RestClient restClient;
    private final ExecutorService executor;
    private final boolean chiaveConfigurata;
    private final int limitDefault;

    public AutoDevClient(@Qualifier("autoDevRestClient") RestClient restClient,
                         @Qualifier("autoDevExecutor") ExecutorService executor,
                         @Value("${app.autodev.api-key}") String apiKey,
                         @Value("${app.autodev.limit-default}") int limitDefault) {
        this.restClient = restClient;
        this.executor = executor;
        this.chiaveConfigurata = apiKey != null && !apiKey.isBlank();
        this.limitDefault = limitDefault;
    }

    /**
     * Dati completi di un annuncio a partire dal suo Listing ID.
     * Le immagini sono su un endpoint diverso e si raggiungono solo tramite il VIN,
     * quindi le due chiamate sono necessariamente in sequenza:
     * 1) GET /listings/{id} (SENZA "select": serve l'intero albero JSON) -> estrae il VIN
     * 2) GET /photos/{vin}  -> galleria in alta risoluzione
     */
    public AnnuncioAutoDevDto getAnnuncioCompleto(String listingId) {
        verificaChiave();

        // ---- Prima chiamata: dati commerciali + scheda tecnica (bloccante: senza questi non c'e' annuncio)
        JsonNode dati;
        try {
            dati = CompletableFuture
                    .supplyAsync(() -> get("/listings/{id}", listingId), executor)
                    .join()
                    .path("data");
        } catch (CompletionException e) {
            throw traduciErrore(e.getCause(), "Annuncio");
        }

        JsonNode vehicle = dati.path("vehicle");
        JsonNode retail = dati.path("retailListing");
        if (vehicle.isMissingNode() || vehicle.isNull()) {
            throw new ExternalApiException("Risposta di auto.dev senza dati del veicolo");
        }
        String vin = Optional.ofNullable(testo(vehicle, "vin")).orElse(testo(dati, "vin"));
        if (vin == null) {
            throw new ExternalApiException("Risposta di auto.dev senza VIN: impossibile recuperare le foto");
        }

        // ---- Seconda chiamata: galleria foto (non bloccante: se fallisce si usa l'immagine principale)
        List<String> foto;
        try {
            foto = CompletableFuture
                    .supplyAsync(() -> estraiFoto(get("/photos/{vin}", vin)), executor)
                    .join();
        } catch (CompletionException e) {
            log.warn("Foto non disponibili da auto.dev per il VIN {}: {}", vin, e.getCause().getMessage());
            foto = new ArrayList<>();
        }
        if (foto.isEmpty()) {
            String principale = testo(retail, "primaryImage");
            if (urlSicuro(principale)) {
                foto.add(principale);
            }
        }

        // ---- Unione delle due risposte in un unico oggetto
        return new AnnuncioAutoDevDto(
                listingId,
                vin,
                testo(vehicle, "make"),
                testo(vehicle, "model"),
                intero(vehicle, "year"),
                // Nel JSON reale il campo e' "fuel"; "fuelType" tenuto come alternativa
                Optional.ofNullable(testo(vehicle, "fuel")).orElse(testo(vehicle, "fuelType")),
                decimale(retail, "price"),
                intero(retail, "miles"),
                retail.path("used").isBoolean() ? retail.path("used").asBoolean() : null,
                venditore(retail),
                descrizione(retail),
                vehicle,
                foto
        );
    }

    /**
     * Ricerca generica su GET /listings con filtri opzionali marca/modello, paginata (page parte da 1).
     * Una chiamata per pagina; il numero di risultati per pagina (limit) non cambia il costo.
     */
    public List<AnnuncioAutoDevRiassuntoDto> cercaAnnunci(String marca, String modello, Integer limit, int pagina) {
        verificaChiave();
        int limite = limit != null ? limit : limitDefault;

        JsonNode risposta;
        try {
            risposta = CompletableFuture.supplyAsync(() -> restClient.get()
                    // I valori passano come variabili URI: vengono codificati, niente concatenazione di stringhe
                    .uri(b -> {
                        Map<String, Object> variabili = new HashMap<>();
                        b.path("/listings").queryParam("limit", "{limit}").queryParam("page", "{page}");
                        variabili.put("limit", limite);
                        variabili.put("page", pagina);
                        if (marca != null) {
                            b.queryParam("vehicle.make", "{make}");
                            variabili.put("make", marca);
                        }
                        if (modello != null) {
                            b.queryParam("vehicle.model", "{model}");
                            variabili.put("model", modello);
                        }
                        return b.build(variabili);
                    })
                    .retrieve()
                    .body(JsonNode.class), executor).join();
        } catch (CompletionException e) {
            throw traduciErrore(e.getCause(), "Ricerca annunci");
        }

        List<AnnuncioAutoDevRiassuntoDto> risultati = new ArrayList<>();
        for (JsonNode annuncio : risposta.path("data")) {
            JsonNode vehicle = annuncio.path("vehicle");
            JsonNode retail = annuncio.path("retailListing");
            String principale = testo(retail, "primaryImage");
            risultati.add(new AnnuncioAutoDevRiassuntoDto(
                    Optional.ofNullable(testo(annuncio, "vin")).orElse(testo(vehicle, "vin")),
                    testo(vehicle, "make"),
                    testo(vehicle, "model"),
                    intero(vehicle, "year"),
                    Optional.ofNullable(testo(vehicle, "fuel")).orElse(testo(vehicle, "fuelType")),
                    decimale(retail, "price"),
                    intero(retail, "miles"),
                    retail.path("used").isBoolean() ? retail.path("used").asBoolean() : null,
                    urlSicuro(principale) ? principale : null
            ));
        }
        return risultati;
    }

    // ---------------------------------------------------------------------------------------------

    private JsonNode get(String template, String variabile) {
        return restClient.get()
                .uri(template, variabile)
                .retrieve()
                .body(JsonNode.class);
    }

    private void verificaChiave() {
        if (!chiaveConfigurata) {
            throw new ExternalApiException("API key di auto.dev non configurata (variabile d'ambiente AUTODEV_API_KEY)");
        }
    }

    // Converte l'errore della chiamata in un'eccezione dell'applicazione (404 o 502)
    private RuntimeException traduciErrore(Throwable causa, String risorsa) {
        if (causa instanceof NotFoundException || causa instanceof ExternalApiException) {
            return (RuntimeException) causa;
        }
        if (causa instanceof RestClientResponseException r) {
            int status = r.getStatusCode().value();
            if (status == HttpStatus.NOT_FOUND.value()) {
                return new NotFoundException(risorsa + " non trovato su auto.dev");
            }
            log.warn("auto.dev ha risposto {} ({})", status, risorsa);
            if (status == HttpStatus.UNAUTHORIZED.value() || status == HttpStatus.FORBIDDEN.value()) {
                return new ExternalApiException("auto.dev ha rifiutato la API key");
            }
            if (status == HttpStatus.TOO_MANY_REQUESTS.value()) {
                return new ExternalApiException("Limite di richieste ad auto.dev raggiunto, riprova piu' tardi");
            }
            return new ExternalApiException("auto.dev ha risposto con errore " + status);
        }
        if (causa instanceof ResourceAccessException) {
            log.warn("auto.dev non raggiungibile ({}): {}", risorsa, causa.getMessage());
            return new ExternalApiException("auto.dev non raggiungibile");
        }
        log.error("Errore imprevisto nella chiamata ad auto.dev ({})", risorsa, causa);
        return new ExternalApiException("Errore nella comunicazione con auto.dev", causa);
    }

    // /photos/{vin} -> data.retail[] (+ eventuali data.wholesale[]), senza duplicati e solo URL https
    private List<String> estraiFoto(JsonNode risposta) {
        Set<String> urls = new LinkedHashSet<>();
        for (String gruppo : List.of("retail", "wholesale")) {
            for (JsonNode url : risposta.path("data").path(gruppo)) {
                if (url.isString() && urlSicuro(url.asString())) {
                    urls.add(url.asString());
                }
            }
        }
        return new ArrayList<>(urls);
    }

    // Gli URL finiscono in <img src> nel frontend: si accettano solo https (niente javascript:, data:, http)
    private boolean urlSicuro(String url) {
        return url != null && url.startsWith("https://") && url.length() <= 1000;
    }

    private String descrizione(JsonNode retail) {
        for (String campo : CAMPI_DESCRIZIONE) {
            String valore = testo(retail, campo);
            if (valore != null) {
                return valore;
            }
        }
        return null;
    }

    private String venditore(JsonNode retail) {
        String dealer = testo(retail, "dealer");
        if (dealer == null) {
            return null;
        }
        String citta = testo(retail, "city");
        String stato = testo(retail, "state");
        if (citta == null) {
            return dealer;
        }
        return dealer + " - " + citta + (stato != null ? " (" + stato + ")" : "");
    }

    private static String testo(JsonNode nodo, String campo) {
        JsonNode valore = nodo.path(campo);
        if (valore.isMissingNode() || valore.isNull()) {
            return null;
        }
        String s = valore.asString("").trim();
        return s.isEmpty() ? null : s;
    }

    private static Integer intero(JsonNode nodo, String campo) {
        JsonNode valore = nodo.path(campo);
        return valore.isNumber() ? valore.asInt() : null;
    }

    private static BigDecimal decimale(JsonNode nodo, String campo) {
        JsonNode valore = nodo.path(campo);
        return valore.isNumber() ? valore.decimalValue() : null;
    }
}
