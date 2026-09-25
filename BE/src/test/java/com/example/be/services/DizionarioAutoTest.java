package com.example.be.services;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.*;

class DizionarioAutoTest {

    private final JsonMapper mapper = JsonMapper.builder().build();

    @Test
    void schedaTradottaConValoriNoti() {
        // Dati reali restituiti da auto.dev per il VIN 4S4BTANC3S3331550
        JsonNode originale = mapper.readTree("""
                {"bodyStyle":"SUV","cylinders":4,"doors":4,"drivetrain":"AWD","engine":"2.5L 4Cyl Gasoline",
                 "exteriorColor":"White","interiorColor":"Black","transmission":"Automatic","trim":"Limited"}
                """);

        JsonNode scheda = DizionarioAuto.schedaInItaliano(originale);

        assertEquals("SUV", scheda.path("bodyStyle").asString());
        assertEquals("Integrale (AWD)", scheda.path("drivetrain").asString());
        assertEquals("2.5L 4 cilindri benzina", scheda.path("engine").asString());
        assertEquals("Bianco", scheda.path("exteriorColor").asString());
        assertEquals("Nero", scheda.path("interiorColor").asString());
        assertEquals("Automatico", scheda.path("transmission").asString());
        assertEquals("Limited", scheda.path("trim").asString(), "l'allestimento e' un nome proprio");
        assertEquals(4, scheda.path("cylinders").asInt(), "i numeri restano numeri");
        assertEquals("White", originale.path("exteriorColor").asString(), "il nodo originale non cambia");
    }

    @Test
    void coloreCommercialeInvariatoETraduzioneIdempotente() {
        JsonNode originale = mapper.readTree("""
                {"bodyStyle":"Sedan","exteriorColor":"Wind Chill Pearl","engine":"2.0L 4Cyl Plug-In Hybrid"}
                """);

        JsonNode una = DizionarioAuto.schedaInItaliano(originale);
        JsonNode due = DizionarioAuto.schedaInItaliano(una);

        assertEquals("Berlina", una.path("bodyStyle").asString());
        assertEquals("Wind Chill Pearl", una.path("exteriorColor").asString());
        assertEquals("2.0L 4 cilindri ibrido plug-in", una.path("engine").asString());
        assertEquals(una, due, "applicata due volte non cambia nulla");
    }

    @Test
    void schedaAssente() {
        assertNull(DizionarioAuto.schedaInItaliano(null));
    }
}
