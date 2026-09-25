package com.example.be.services;

import com.example.be.exceptions.BadRequestException;
import org.springframework.data.domain.Sort;

import java.util.Locale;
import java.util.Map;

// Il campo di ordinamento arriva dal client e non si puo' passare come parametro di una query:
// si confronta con un ELENCO CHIUSO di valori ammessi e si usa solo il nome di campo deciso qui.
// Qualsiasi altro valore -> 400. Formato: "campo" oppure "campo,asc|desc" (es. "prezzo,desc").
public final class OrdinamentoAuto {

    // chiave = valore accettato dal client, valore = attributo dell'entita' Auto
    private static final Map<String, String> CAMPI_AMMESSI = Map.of(
            "prezzo", "prezzo",
            "km", "km",
            "anno", "anno",
            "marca", "marca",
            "data", "createdAt"
    );

    private static final Sort DEFAULT = Sort.by(Sort.Direction.DESC, "createdAt");

    private OrdinamentoAuto() {
    }

    public static Sort da(String sort) {
        if (sort == null || sort.isBlank()) {
            return DEFAULT.and(Sort.by("id"));
        }
        String[] parti = sort.trim().toLowerCase(Locale.ROOT).split(",");
        String campo = CAMPI_AMMESSI.get(parti[0].trim());
        if (campo == null || parti.length > 2) {
            throw new BadRequestException("Ordinamento non ammesso. Valori validi: " + String.join(", ", CAMPI_AMMESSI.keySet())
                    + " (opzionalmente seguiti da ,asc o ,desc)");
        }
        Sort.Direction direzione = Sort.Direction.ASC;
        if (parti.length == 2) {
            direzione = switch (parti[1].trim()) {
                case "asc" -> Sort.Direction.ASC;
                case "desc" -> Sort.Direction.DESC;
                default -> throw new BadRequestException("Direzione di ordinamento non ammessa: usare asc o desc");
            };
        }
        // "id" come secondo criterio: ordinamento stabile tra le pagine a parita' di valore
        return Sort.by(direzione, campo).and(Sort.by("id"));
    }
}
