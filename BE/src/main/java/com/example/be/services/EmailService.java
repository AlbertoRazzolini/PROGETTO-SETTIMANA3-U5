package com.example.be.services;

import com.example.be.exceptions.ErroriPerLog;
import com.example.be.dto.mail.MailSogliaPrezzoDto;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;

@Slf4j
@Service
public class EmailService {

    private static final Locale ITALIANO = Locale.ITALY;

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final String mittente;
    private final String frontendUrl;
    private final String backendUrl;

    public EmailService(JavaMailSender mailSender,
                        TemplateEngine templateEngine,
                        @Value("${app.mail.mittente}") String mittente,
                        @Value("${app.frontend-url}") String frontendUrl,
                        @Value("${app.backend-url}") String backendUrl) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.mittente = mittente;
        this.frontendUrl = frontendUrl;
        this.backendUrl = backendUrl;
    }

    /**
     * Invia la mail "il prezzo e' sceso sotto la tua soglia".
     * Asincrona: un problema SMTP non blocca ne' fa fallire l'operazione che l'ha scatenata.
     * Nei log non finiscono ne' l'indirizzo email ne' il nome del destinatario: solo l'id dell'avviso.
     */
    @Async
    public void inviaSogliaPrezzo(MailSogliaPrezzoDto dati) {
        try {
            MimeMessage messaggio = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(messaggio, true, StandardCharsets.UTF_8.name());
            helper.setFrom(mittente);
            helper.setTo(dati.destinatario());
            helper.setSubject("Prezzo in calo: " + dati.marca() + " " + dati.modello());
            // Versione testo semplice + HTML (i client che non mostrano HTML usano la prima)
            helper.setText(testoSemplice(dati), componiHtml(dati));
            mailSender.send(messaggio);
            log.info("Mail soglia prezzo inviata (avviso id {})", dati.avvisoId());
        } catch (MessagingException | MailException e) {
            // Solo il tipo di errore: il messaggio SMTP spesso contiene l'indirizzo del destinatario
            log.warn("Invio mail soglia prezzo fallito (avviso id {}): {}", dati.avvisoId(), ErroriPerLog.descrivi(e));
        }
    }

    // Il template usa solo th:text / th:href: Thymeleaf fa l'escape di ogni valore,
    // quindi un nome come "<script>..." arriva nella mail come testo, non come HTML
    public String componiHtml(MailSogliaPrezzoDto dati) {
        Context ctx = new Context(ITALIANO);
        ctx.setVariable("nome", dati.nome());
        ctx.setVariable("auto", dati.marca() + " " + dati.modello());
        ctx.setVariable("prezzo", euro(dati.prezzo()));
        ctx.setVariable("soglia", euro(dati.soglia()));
        ctx.setVariable("linkAuto", linkAuto(dati));
        ctx.setVariable("linkDisattiva", linkDisattiva(dati));
        return templateEngine.process("mail/soglia-prezzo", ctx);
    }

    private String testoSemplice(MailSogliaPrezzoDto dati) {
        return "Ciao " + dati.nome() + ",\n\n"
                + "il prezzo di " + dati.marca() + " " + dati.modello() + " e' sceso a " + euro(dati.prezzo())
                + ", sotto la soglia di " + euro(dati.soglia()) + " che avevi impostato.\n\n"
                + "Vedi l'annuncio: " + linkAuto(dati) + "\n\n"
                + "Non vuoi piu' ricevere avvisi per questa auto? " + linkDisattiva(dati) + "\n";
    }

    private String linkAuto(MailSogliaPrezzoDto dati) {
        return UriComponentsBuilder.fromUriString(frontendUrl)
                .pathSegment("auto", dati.autoId().toString())
                .toUriString();
    }

    // Link di disattivazione con token casuale e monouso, mai l'id dell'avviso
    private String linkDisattiva(MailSogliaPrezzoDto dati) {
        return UriComponentsBuilder.fromUriString(backendUrl)
                .path("/api/avvisi/disattiva")
                .queryParam("token", dati.tokenDisattivazione())
                .encode()
                .toUriString();
    }

    private static String euro(BigDecimal valore) {
        return NumberFormat.getCurrencyInstance(ITALIANO).format(valore);
    }
}
