package com.example.be.external;

import com.example.be.exceptions.ErroriPerLog;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.HtmlUtils;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Traduzione EN -> IT delle descrizioni importate da auto.dev.
 *
 * Perche' MyMemory (api.mymemory.translated.net):
 *  - e' gratuita e NON richiede API key ne' registrazione (DeepL e Google invece si'):
 *    chi clona il repo per la correzione ha la traduzione funzionante senza configurare nulla;
 *  - ha pero' dei limiti: max ~500 caratteri per richiesta (per questo il testo viene diviso
 *    in blocchi), una quota giornaliera anonima e una qualita' da traduttore automatico.
 * Per questo la traduzione viene fatta UNA sola volta all'import, salvata nel DB e resta
 * modificabile dall'admin prima della pubblicazione. Se il servizio non risponde si tiene
 * il testo originale, cosi' l'import non fallisce per colpa della traduzione.
 */
@Slf4j
@Service
public class TraduzioneService {

    private static final int MAX_CARATTERI_BLOCCO = 450;

    private final RestClient restClient;

    public TraduzioneService(@Qualifier("myMemoryRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public String traduciInItaliano(String testo) {
        if (testo == null || testo.isBlank()) {
            return testo;
        }
        StringBuilder risultato = new StringBuilder();
        for (String blocco : dividiInBlocchi(testo.trim())) {
            if (!risultato.isEmpty()) {
                risultato.append(' ');
            }
            risultato.append(traduciBlocco(blocco));
        }
        return risultato.toString();
    }

    private String traduciBlocco(String blocco) {
        try {
            JsonNode risposta = restClient.get()
                    // Testo passato come variabile URI: viene codificato correttamente
                    .uri(b -> b.path("/get")
                            .queryParam("q", "{q}")
                            .queryParam("langpair", "{langpair}")
                            .build(Map.of("q", blocco, "langpair", "en|it")))
                    .retrieve()
                    .body(JsonNode.class);

            boolean ok = risposta != null
                    && risposta.path("responseStatus").asInt(0) == 200
                    && !risposta.path("quotaFinished").asBoolean(false);
            String tradotto = ok ? risposta.path("responseData").path("translatedText").asString("") : "";
            if (tradotto.isBlank()) {
                log.warn("Traduzione non disponibile (status {}), uso il testo originale",
                        risposta != null ? risposta.path("responseStatus").asString("?") : "?");
                return blocco;
            }
            // MyMemory a volte restituisce entita' HTML (es. &#39;): si salva testo semplice
            return HtmlUtils.htmlUnescape(tradotto);
        } catch (RestClientException e) {
            log.warn("Servizio di traduzione non raggiungibile, uso il testo originale: {}", ErroriPerLog.descrivi(e));
            return blocco;
        }
    }

    // Divide per frasi senza superare il limite di caratteri; una frase troppo lunga viene spezzata sugli spazi
    private List<String> dividiInBlocchi(String testo) {
        List<String> blocchi = new ArrayList<>();
        StringBuilder corrente = new StringBuilder();
        for (String frase : testo.split("(?<=[.!?])\\s+")) {
            for (String parte : spezza(frase)) {
                if (corrente.length() + parte.length() + 1 > MAX_CARATTERI_BLOCCO && !corrente.isEmpty()) {
                    blocchi.add(corrente.toString());
                    corrente.setLength(0);
                }
                if (!corrente.isEmpty()) {
                    corrente.append(' ');
                }
                corrente.append(parte);
            }
        }
        if (!corrente.isEmpty()) {
            blocchi.add(corrente.toString());
        }
        return blocchi;
    }

    private List<String> spezza(String frase) {
        List<String> parti = new ArrayList<>();
        String resto = frase;
        while (resto.length() > MAX_CARATTERI_BLOCCO) {
            int taglio = resto.lastIndexOf(' ', MAX_CARATTERI_BLOCCO);
            if (taglio <= 0) {
                taglio = MAX_CARATTERI_BLOCCO;
            }
            parti.add(resto.substring(0, taglio).trim());
            resto = resto.substring(taglio).trim();
        }
        if (!resto.isEmpty()) {
            parti.add(resto);
        }
        return parti;
    }
}
