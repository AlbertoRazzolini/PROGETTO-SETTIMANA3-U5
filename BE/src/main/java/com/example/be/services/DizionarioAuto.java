package com.example.be.services;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Traduzione in italiano dei valori tecnici di auto.dev (mercato USA, in inglese).
 * Sono un insieme limitato (carrozzeria, cambio, trazione, colori base, carburante nel motore):
 * dizionari fissi, senza chiamare il servizio di traduzione, cosi' il risultato e' sempre identico.
 * I valori non presenti (es. colori commerciali come "Wind Chill Pearl", allestimenti come "Limited")
 * sono nomi propri del costruttore e restano invariati.
 * Usato sia per la descrizione generata (DescrizioneAutoGenerator) sia per la scheda tecnica mostrata.
 */
public final class DizionarioAuto {

    private DizionarioAuto() {
    }

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

    // Parole del campo "engine" (es. "2.0L 4Cyl Turbo Gasoline"): le piu' lunghe prima ("plug-in hybrid" prima di "hybrid")
    private static final Map<Pattern, String> MOTORE = new LinkedHashMap<>();

    static {
        MOTORE.put(Pattern.compile("(\\d+)\\s*Cyl\\b", Pattern.CASE_INSENSITIVE), "$1 cilindri");
        MOTORE.put(Pattern.compile("\\bplug-in hybrid\\b", Pattern.CASE_INSENSITIVE), "ibrido plug-in");
        MOTORE.put(Pattern.compile("\\bflex[- ]fuel\\b", Pattern.CASE_INSENSITIVE), "flex fuel (E85)");
        MOTORE.put(Pattern.compile("\\bgasoline\\b", Pattern.CASE_INSENSITIVE), "benzina");
        MOTORE.put(Pattern.compile("\\bhybrid\\b", Pattern.CASE_INSENSITIVE), "ibrido");
        MOTORE.put(Pattern.compile("\\belectric\\b", Pattern.CASE_INSENSITIVE), "elettrico");
        MOTORE.put(Pattern.compile("\\bdiesel\\b", Pattern.CASE_INSENSITIVE), "diesel");
    }

    public static String carrozzeria(String valore) {
        return traduci(CARROZZERIE, valore);
    }

    public static String cambio(String valore) {
        return traduci(CAMBI, valore);
    }

    public static String trazione(String valore) {
        return traduci(TRAZIONI, valore);
    }

    public static String colore(String valore) {
        return traduci(COLORI, valore);
    }

    public static String motore(String valore) {
        if (valore == null) {
            return null;
        }
        String s = valore.trim();
        for (Map.Entry<Pattern, String> voce : MOTORE.entrySet()) {
            s = voce.getKey().matcher(s).replaceAll(voce.getValue());
        }
        return s;
    }

    /**
     * Copia della scheda tecnica ("vehicle" di auto.dev) con i valori testuali noti in italiano,
     * con l'iniziale maiuscola perche' vengono mostrati da soli in una tabella.
     * Non modifica il nodo originale. Idempotente: su una scheda gia' tradotta non cambia nulla.
     */
    public static JsonNode schedaInItaliano(JsonNode scheda) {
        if (!(scheda instanceof ObjectNode originale)) {
            return scheda;
        }
        ObjectNode copia = originale.deepCopy();
        sostituisci(copia, "bodyStyle", carrozzeria(testo(copia, "bodyStyle")));
        sostituisci(copia, "transmission", cambio(testo(copia, "transmission")));
        sostituisci(copia, "drivetrain", trazione(testo(copia, "drivetrain")));
        sostituisci(copia, "engine", motore(testo(copia, "engine")));
        sostituisci(copia, "exteriorColor", colore(testo(copia, "exteriorColor")));
        sostituisci(copia, "interiorColor", colore(testo(copia, "interiorColor")));
        return copia;
    }

    private static void sostituisci(ObjectNode nodo, String campo, String valore) {
        if (valore != null) {
            nodo.put(campo, maiuscola(valore));
        }
    }

    private static String testo(JsonNode nodo, String campo) {
        JsonNode valore = nodo.path(campo);
        if (!valore.isString()) {
            return null;
        }
        String s = valore.asString().trim();
        return s.isEmpty() ? null : s;
    }

    private static String traduci(Map<String, String> dizionario, String valore) {
        if (valore == null) {
            return null;
        }
        return dizionario.getOrDefault(valore.trim().toLowerCase(Locale.ROOT), valore.trim());
    }

    private static String maiuscola(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
