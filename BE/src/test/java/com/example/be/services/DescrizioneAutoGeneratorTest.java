package com.example.be.services;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.*;

class DescrizioneAutoGeneratorTest {

    private final DescrizioneAutoGenerator generator = new DescrizioneAutoGenerator();
    private final JsonMapper mapper = JsonMapper.builder().build();

    @Test
    void generaDescrizioneItalianaDaSchedaTecnica() {
        // Dati reali restituiti da auto.dev per il VIN 4S4BTANC3S3331550
        JsonNode vehicle = mapper.readTree("""
                {"bodyStyle":"SUV","cylinders":4,"doors":4,"drivetrain":"AWD","engine":"2.5L 4Cyl Gasoline",
                 "exteriorColor":"White","fuel":"Gasoline","interiorColor":"Black","make":"Subaru",
                 "model":"Outback","seats":5,"transmission":"Automatic","trim":"Limited","year":2025}
                """);

        String descrizione = generator.genera("Subaru", "Outback", 2025, "Benzina", vehicle);

        assertEquals("Subaru Outback Limited del 2025, SUV a 4 porte e 5 posti. "
                + "Motore 2.5L a 4 cilindri alimentato a benzina, cambio automatico, trazione integrale (AWD). "
                + "Colore esterno: bianco. Interni: nero.", descrizione);
    }

    @Test
    void autoElettricaEColoreCommercialeNonTradotto() {
        JsonNode vehicle = mapper.readTree("""
                {"bodyStyle":"Sedan","drivetrain":"RWD","exteriorColor":"Midnight Silver Metallic",
                 "transmission":"Automatic","doors":4,"seats":5}
                """);

        String descrizione = generator.genera("Tesla", "Model 3", 2023, "Elettrica", vehicle);

        assertEquals("Tesla Model 3 del 2023, berlina a 4 porte e 5 posti. "
                + "Motore elettrico, cambio automatico, trazione posteriore. "
                + "Colore esterno: Midnight Silver Metallic.", descrizione);
    }

    @Test
    void schedaVuotaRestituisceNull() {
        assertNull(generator.genera(null, null, null, null, mapper.readTree("{}")));
    }
}
