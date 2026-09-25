package com.example.be.services;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.Locale;
import java.util.Map;
import java.util.StringJoiner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Genera direttamente in italiano la descrizione di un'auto a partire dalla scheda tecnica
 * ("vehicle" di auto.dev), quando il venditore non ne ha scritta una.
 * I valori tecnici di auto.dev sono un insieme limitato (carrozzeria, cambio, trazione, colori base):
 * vengono tradotti con dizionari fissi, senza chiamare il servizio di traduzione.
 * I valori non presenti nei dizionari (es. nomi commerciali dei colori come "Crystal White Pearl")
 * restano invariati.
 */
@Component
public class DescrizioneAutoGenerator {

    private static final Map<String, String> CARROZZERIE = Map.ofEntries(
            Map.entry("suv", "SUV"),
            Map.entry("sedan", "berlina"),
            Map.entry("coupe", "coupé"),
            Map.entry("convertible", "cabriolet"),
            Map.entry("hatchback", "hatchback"),
            Map.entry("wagon", "station wagon"),
            Map.entry("pickup", "pick-up"),
            Map.entry("truck", "pick-up"),
            Map.entry("minivan", "monovolume"),
            Map.entry("van", "furgone")
    );

    private static final Map<String, String> CAMBI = Map.of(
            "automatic", "automatico",
            "manual", "manuale",
            "cvt", "automatico a variazione continua (CVT)"
    );

    private static final Map<String, String> TRAZIONI = Map.of(
            "awd", "integrale (AWD)",
            "4wd", "integrale inseribile (4WD)",
            "fwd", "anteriore",
            "rwd", "posteriore"
    );

    private static final Map<String, String> COLORI = Map.ofEntries(
            Map.entry("white", "bianco"),
            Map.entry("black", "nero"),
            Map.entry("silver", "argento"),
            Map.entry("gray", "grigio"),
            Map.entry("grey", "grigio"),
            Map.entry("blue", "blu"),
            Map.entry("red", "rosso"),
            Map.entry("green", "verde"),
            Map.entry("brown", "marrone"),
            Map.entry("beige", "beige"),
            Map.entry("gold", "oro"),
            Map.entry("orange", "arancione"),
            Map.entry("yellow", "giallo"),
            Map.entry("purple", "viola")
    );

    // Es. "2.5L 4Cyl Gasoline" -> "2.5L"
    private static final Pattern CILINDRATA = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*L", Pattern.CASE_INSENSITIVE);

    /**
     * Es: "Subaru Outback Limited del 2025, SUV a 4 porte e 5 posti. Motore 2.5L a 4 cilindri
     * alimentato a benzina, cambio automatico a variazione continua (CVT), trazione integrale (AWD).
     * Colore esterno: bianco. Interni: nero."
     *
     * @param carburante carburante gia' in italiano (es. "Benzina", "Elettrica")
     */
    public String genera(String marca, String modello, Integer anno, String carburante, JsonNode vehicle) {
        StringJoiner frasi = new StringJoiner(" ");

        // --- Modello, anno e carrozzeria
        StringJoiner nome = new StringJoiner(" ");
        aggiungi(nome, marca);
        aggiungi(nome, modello);
        aggiungi(nome, testo(vehicle, "trim"));
        StringBuilder prima = new StringBuilder(nome.toString());
        if (anno != null) {
            prima.append(prima.isEmpty() ? "Anno " : " del ").append(anno);
        }
        String carrozzeria = traduci(CARROZZERIE, testo(vehicle, "bodyStyle"));
        Integer porte = intero(vehicle, "doors");
        Integer posti = intero(vehicle, "seats");
        if (carrozzeria != null || porte != null || posti != null) {
            StringBuilder dettagli = new StringBuilder(carrozzeria != null ? carrozzeria : "carrozzeria");
            if (porte != null) {
                dettagli.append(" a ").append(porte).append(" porte");
            }
            if (posti != null) {
                dettagli.append(porte != null ? " e " : " con ").append(posti).append(" posti");
            }
            prima.append(prima.isEmpty() ? "" : ", ").append(dettagli);
        }
        if (!prima.isEmpty()) {
            frasi.add(maiuscola(prima.toString()) + ".");
        }

        // --- Motore, cambio, trazione
        StringJoiner meccanica = new StringJoiner(", ");
        String motore = descriviMotore(testo(vehicle, "engine"), intero(vehicle, "cylinders"), carburante);
        aggiungi(meccanica, motore);
        String cambio = traduci(CAMBI, testo(vehicle, "transmission"));
        if (cambio != null) {
            meccanica.add("cambio " + cambio);
        }
        String trazione = traduci(TRAZIONI, testo(vehicle, "drivetrain"));
        if (trazione != null) {
            meccanica.add("trazione " + trazione);
        }
        if (meccanica.length() > 0) {
            frasi.add(maiuscola(meccanica.toString()) + ".");
        }

        // --- Colori
        String esterno = traduci(COLORI, testo(vehicle, "exteriorColor"));
        if (esterno != null) {
            frasi.add("Colore esterno: " + esterno + ".");
        }
        String interno = traduci(COLORI, testo(vehicle, "interiorColor"));
        if (interno != null) {
            frasi.add("Interni: " + interno + ".");
        }

        return frasi.length() > 0 ? frasi.toString() : null;
    }

    private String descriviMotore(String engine, Integer cilindri, String carburante) {
        boolean elettrica = carburante != null && carburante.toLowerCase(Locale.ROOT).startsWith("elettric");
        if (elettrica) {
            return "motore elettrico";
        }
        StringBuilder s = new StringBuilder();
        if (engine != null) {
            Matcher m = CILINDRATA.matcher(engine);
            if (m.find()) {
                s.append("motore ").append(m.group(1)).append("L");
            }
        }
        if (cilindri != null && cilindri > 0) {
            s.append(s.isEmpty() ? "motore" : "").append(" a ").append(cilindri).append(" cilindri");
        }
        if (carburante != null) {
            s.append(s.isEmpty() ? "alimentazione " : " alimentato a ").append(carburante.toLowerCase(Locale.ROOT));
        }
        return s.isEmpty() ? null : s.toString();
    }

    private static String traduci(Map<String, String> dizionario, String valore) {
        if (valore == null) {
            return null;
        }
        return dizionario.getOrDefault(valore.trim().toLowerCase(Locale.ROOT), valore.trim());
    }

    private static void aggiungi(StringJoiner joiner, String valore) {
        if (valore != null && !valore.isBlank()) {
            joiner.add(valore);
        }
    }

    private static String maiuscola(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private static String testo(JsonNode nodo, String campo) {
        if (nodo == null) {
            return null;
        }
        JsonNode valore = nodo.path(campo);
        if (valore.isMissingNode() || valore.isNull()) {
            return null;
        }
        String s = valore.asString("").trim();
        return s.isEmpty() ? null : s;
    }

    private static Integer intero(JsonNode nodo, String campo) {
        if (nodo == null) {
            return null;
        }
        JsonNode valore = nodo.path(campo);
        return valore.isNumber() ? valore.asInt() : null;
    }
}
