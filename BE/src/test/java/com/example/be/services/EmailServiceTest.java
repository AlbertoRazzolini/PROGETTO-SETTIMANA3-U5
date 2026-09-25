package com.example.be.services;

import com.example.be.dto.mail.MailSogliaPrezzoDto;
import org.junit.jupiter.api.Test;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

// Verifica il contenuto della mail senza inviarla (nessun server SMTP coinvolto)
class EmailServiceTest {

    private final EmailService emailService = new EmailService(
            null, templateEngine(), "mittente@test.it", "http://localhost:5173", "http://localhost:8080");

    private static TemplateEngine templateEngine() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        // Stesso motore usato dall'app (espressioni SpEL)
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        return engine;
    }

    private MailSogliaPrezzoDto dati(String nome) {
        return new MailSogliaPrezzoDto(UUID.randomUUID(), "user@test.it", nome,
                UUID.fromString("99571fad-e987-44b0-8cc2-3126c37a7849"), "Subaru", "Outback",
                new BigDecimal("32400.00"), new BigDecimal("33000.00"), "tok_ABC-123");
    }

    @Test
    void contieneDatiFormattatiELink() {
        String html = emailService.componiHtml(dati("Mario"));

        assertTrue(html.contains("Mario"));
        assertTrue(html.contains("Subaru Outback"));
        assertTrue(html.contains("32.400,00"), "prezzo in formato italiano");
        assertTrue(html.contains("33.000,00"), "soglia in formato italiano");
        assertTrue(html.contains("http://localhost:5173/auto/99571fad-e987-44b0-8cc2-3126c37a7849"));
        assertTrue(html.contains("http://localhost:8080/api/avvisi/disattiva?token=tok_ABC-123"));
    }

    @Test
    void ilNomeDellUtenteVieneEscapato() {
        String html = emailService.componiHtml(dati("<script>alert('x')</script>"));

        assertFalse(html.contains("<script>"), "l'HTML del nome non deve essere interpretato");
        assertTrue(html.contains("&lt;script&gt;"));
    }
}
