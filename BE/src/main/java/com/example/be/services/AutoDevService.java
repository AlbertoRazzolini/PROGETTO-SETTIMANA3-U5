package com.example.be.services;

import com.example.be.dto.autodev.AnnuncioAutoDevDto;
import com.example.be.dto.autodev.AnnuncioAutoDevRiassuntoDto;
import com.example.be.dto.autodev.AnteprimaAnnuncioDto;
import com.example.be.enums.StatoAuto;
import com.example.be.external.AutoDevClient;
import com.example.be.external.TraduzioneService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Trasforma i dati grezzi di auto.dev (mercato USA) in dati "da salone italiano".
 *
 * PROBLEMA: auto.dev restituisce prezzi in dollari, chilometraggio in miglia e testi in inglese,
 * mentre il salone lavora in euro, km e italiano.
 *
 * PROCESSO ADOTTATO (eseguito una sola volta, al momento dell'anteprima/import dell'annuncio):
 *
 *  1. Recupero dati      -> AutoDevClient: GET /listings/{id} (dati + scheda tecnica, da cui il VIN)
 *                           e poi GET /photos/{vin} (galleria), uniti in un unico AnnuncioAutoDevDto.
 *
 *  2. Prezzo USD -> EUR  -> ConversioniService.usdInEur: tasso di cambio FISSO da application.properties
 *                           (app.cambio.usd-eur). Scelta didattica: evita un'ulteriore API esterna di cambio;
 *                           il prezzo in USD viene comunque mostrato in anteprima come riferimento.
 *
 *  3. Miglia -> km       -> ConversioniService.migliaInKm (x 1.609344, max 6 cifre come da vincolo del campo).
 *
 *  4. Inglese -> Italiano, con tre strategie diverse a seconda del dato:
 *     a. Carburante: dizionario fisso (CARBURANTI). I valori sono pochi e servono anche come filtro di
 *        ricerca, quindi devono essere sempre identici (una traduzione automatica potrebbe variare).
 *     b. Descrizione del venditore PRESENTE: e' testo libero in inglese -> TraduzioneService (API MyMemory).
 *     c. Descrizione ASSENTE (caso frequente nel piano Free di auto.dev): DescrizioneAutoGenerator la
 *        compone DIRETTAMENTE in italiano dalla scheda tecnica, senza alcuna traduzione.
 *
 *  5. Stato suggerito    -> retailListing.used: true -> USATO, false -> NUOVO (KM_0 lo decide l'admin).
 *
 * Il risultato (AnteprimaAnnuncioDto) viene salvato nel DB all'import: le conversioni e le traduzioni
 * non si ripetono a ogni visualizzazione (nessun credito API consumato dagli utenti) e l'admin puo'
 * correggere prezzo, km, stato e descrizione prima di pubblicare.
 */
@Service
@RequiredArgsConstructor
public class AutoDevService {

    // Valori di carburante di auto.dev tradotti a mano: sono pochi e usati anche come filtro di ricerca,
    // quindi devono essere sempre uguali (una traduzione automatica potrebbe variare)
    private static final Map<String, String> CARBURANTI = Map.ofEntries(
            Map.entry("gasoline", "Benzina"),
            Map.entry("premium unleaded", "Benzina"),
            Map.entry("regular unleaded", "Benzina"),
            Map.entry("diesel", "Diesel"),
            Map.entry("electric", "Elettrica"),
            Map.entry("hybrid", "Ibrida"),
            Map.entry("plug-in hybrid", "Ibrida plug-in"),
            Map.entry("flex fuel", "Flex Fuel (E85)"),
            Map.entry("flexible fuel", "Flex Fuel (E85)"),
            Map.entry("hydrogen", "Idrogeno"),
            Map.entry("natural gas", "Metano"),
            Map.entry("cng", "Metano"),
            Map.entry("lpg", "GPL")
    );

    private final AutoDevClient autoDevClient;
    private final TraduzioneService traduzioneService;
    private final ConversioniService conversioniService;
    private final DescrizioneAutoGenerator descrizioneAutoGenerator;

    public List<AnnuncioAutoDevRiassuntoDto> cerca(String marca, String modello, Integer limit) {
        return autoDevClient.cercaAnnunci(marca, modello, limit).stream()
                .map(r -> new AnnuncioAutoDevRiassuntoDto(r.listingId(), r.marca(), r.modello(), r.anno(),
                        traduciCarburante(r.carburante()), r.prezzoUsd(), r.miglia(), r.usato(), r.immaginePrincipale()))
                .toList();
    }

    public AnteprimaAnnuncioDto anteprima(String listingId) {
        AnnuncioAutoDevDto a = autoDevClient.getAnnuncioCompleto(listingId);
        String carburante = traduciCarburante(a.carburante());

        // Descrizione del venditore presente (in inglese) -> tradotta con MyMemory.
        // Assente (frequente nel piano Free di auto.dev) -> generata direttamente in italiano
        // dalla scheda tecnica, senza bisogno di traduzione.
        String descrizione = a.descrizione() != null
                ? traduzioneService.traduciInItaliano(a.descrizione())
                : descrizioneAutoGenerator.genera(a.marca(), a.modello(), a.anno(), carburante, a.schedaTecnica());

        return new AnteprimaAnnuncioDto(
                a.listingId(),
                a.vin(),
                a.marca(),
                a.modello(),
                a.anno(),
                carburante,
                a.prezzoUsd(),
                conversioniService.usdInEur(a.prezzoUsd()),
                conversioniService.migliaInKm(a.miglia()),
                statoSuggerito(a),
                a.venditore(),
                descrizione,
                a.schedaTecnica(),
                a.foto()
        );
    }

    // Solo un suggerimento: la distinzione NUOVO / KM_0 la decide l'admin
    private StatoAuto statoSuggerito(AnnuncioAutoDevDto a) {
        if (a.usato() == null) {
            return null;
        }
        return a.usato() ? StatoAuto.USATO : StatoAuto.NUOVO;
    }

    private String traduciCarburante(String carburante) {
        if (carburante == null) {
            return null;
        }
        return CARBURANTI.getOrDefault(carburante.trim().toLowerCase(Locale.ROOT), carburante);
    }
}
