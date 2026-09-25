package com.example.be.services;

import com.example.be.dto.PaginaDto;
import com.example.be.dto.avvisi.AvvisoDto;
import com.example.be.dto.mail.MailSogliaPrezzoDto;
import com.example.be.entities.Auto;
import com.example.be.entities.Avviso;
import com.example.be.entities.Preferito;
import com.example.be.entities.User;
import com.example.be.enums.StatoPubblicazione;
import com.example.be.events.PrezzoAutoAggiornatoEvent;
import com.example.be.exceptions.ConflictException;
import com.example.be.exceptions.NotFoundException;
import com.example.be.repositories.AvvisoRepository;
import com.example.be.repositories.PreferitoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.text.NumberFormat;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AvvisoService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final AvvisoRepository avvisoRepository;
    private final PreferitoRepository preferitoRepository;
    private final NotificaService notificaService;
    private final EmailService emailService;
    private final AutoMapper autoMapper;

    @Transactional(readOnly = true)
    public PaginaDto<AvvisoDto> elenca(UUID userId, int pagina) {
        PageRequest pageable = PageRequest.of(pagina, AutoService.DIMENSIONE_PAGINA,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by("id")));
        return PaginaDto.da(avvisoRepository.findByPreferitoUserId(userId, pageable), this::toDto);
    }

    // La soglia si imposta solo su un PROPRIO preferito (id + proprietario): altrimenti 404
    @Transactional
    public AvvisoDto crea(UUID userId, UUID preferitoId, BigDecimal soglia) {
        Preferito preferito = preferitoRepository.findByIdAndUserId(preferitoId, userId)
                .orElseThrow(() -> new NotFoundException("Preferito non trovato"));
        if (avvisoRepository.existsByPreferitoId(preferitoId)) {
            throw new ConflictException("Esiste gia' un avviso per questa auto: modificane la soglia");
        }
        Avviso avviso = new Avviso(preferito, soglia);
        avviso.setTokenDisattivazione(nuovoToken());
        avvisoRepository.saveAndFlush(avviso);
        // Il prezzo potrebbe essere gia' sotto la soglia appena impostata
        verifica(avviso);
        return toDto(avviso);
    }

    // Nuova soglia: l'avviso torna attivo (anche se era stato disattivato dal link della mail)
    @Transactional
    public AvvisoDto aggiornaSoglia(UUID userId, UUID avvisoId, BigDecimal soglia) {
        Avviso avviso = trova(userId, avvisoId);
        avviso.setSoglia(soglia);
        avviso.setAttivo(true);
        if (avviso.getTokenDisattivazione() == null) {
            avviso.setTokenDisattivazione(nuovoToken());
        }
        verifica(avviso);
        avvisoRepository.saveAndFlush(avviso);
        return toDto(avviso);
    }

    @Transactional
    public void elimina(UUID userId, UUID avvisoId) {
        avvisoRepository.delete(trova(userId, avvisoId));
    }

    /**
     * Disattivazione dal link della mail: il link contiene un token casuale e monouso, mai l'id.
     * Dopo l'uso il token viene cancellato, quindi lo stesso link non funziona una seconda volta.
     * @return true se il token era valido
     */
    @Transactional
    public boolean disattivaConToken(String token) {
        return avvisoRepository.findByTokenDisattivazione(token)
                .map(avviso -> {
                    avviso.setAttivo(false);
                    avviso.setTokenDisattivazione(null);
                    log.info("Avviso id {} disattivato dal link della mail", avviso.getId());
                    return true;
                })
                .orElse(false);
    }

    /**
     * Quando l'admin cambia il prezzo di un'auto pubblicata (o la pubblica) si ricontrollano
     * tutti gli avvisi attivi su quell'auto. Gira DOPO il commit della modifica del prezzo,
     * in una transazione separata: un problema qui non annulla la modifica dell'admin.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onPrezzoAggiornato(PrezzoAutoAggiornatoEvent evento) {
        for (Avviso avviso : avvisoRepository.findByPreferitoAutoIdAndAttivoTrue(evento.autoId())) {
            verifica(avviso);
        }
    }

    /**
     * Regola di invio:
     *  - l'auto e' pubblicata e il prezzo e' SOTTO la soglia;
     *  - per questa soglia non e' ancora stata inviata la mail: si invia se non e' mai stata
     *    inviata, oppure se l'utente ha impostato una soglia PIU' BASSA di quella gia' notificata.
     * Esempio: soglia 30.000 -> prezzo 29.000 -> mail. Il prezzo scende a 28.000 -> niente mail
     * (gia' avvisato). L'utente abbassa la soglia a 25.000 -> il prezzo scende a 24.000 -> nuova mail.
     */
    private void verifica(Avviso avviso) {
        Auto auto = avviso.getPreferito().getAuto();
        if (!avviso.isAttivo()
                || auto.getStatoPubblicazione() != StatoPubblicazione.PUBBLICATO
                || auto.getPrezzo() == null
                || auto.getPrezzo().compareTo(avviso.getSoglia()) >= 0) {
            return;
        }
        BigDecimal giaNotificata = avviso.getSogliaUltimaNotifica();
        if (giaNotificata != null && avviso.getSoglia().compareTo(giaNotificata) >= 0) {
            return;
        }

        avviso.setSogliaUltimaNotifica(avviso.getSoglia());
        User user = avviso.getPreferito().getUser();
        String messaggio = "Il prezzo di " + auto.getMarca() + " " + auto.getModello() + " e' sceso a "
                + euro(auto.getPrezzo()) + ", sotto la tua soglia di " + euro(avviso.getSoglia()) + ".";
        notificaService.crea(user, auto, messaggio);

        MailSogliaPrezzoDto mail = new MailSogliaPrezzoDto(avviso.getId(), user.getEmail(), user.getNome(),
                auto.getId(), auto.getMarca(), auto.getModello(), auto.getPrezzo(), avviso.getSoglia(),
                avviso.getTokenDisattivazione());
        // La mail parte solo se la transazione va a buon fine (niente mail per un avviso poi annullato)
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                emailService.inviaSogliaPrezzo(mail);
            }
        });
        log.info("Soglia raggiunta per avviso id {}: notifica creata e mail in invio", avviso.getId());
    }

    private Avviso trova(UUID userId, UUID avvisoId) {
        return avvisoRepository.findByIdAndPreferitoUserId(avvisoId, userId)
                .orElseThrow(() -> new NotFoundException("Avviso non trovato"));
    }

    // 32 byte casuali (256 bit) in Base64 URL-safe: impossibile da indovinare, sicuro dentro un URL
    private static String nuovoToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String euro(BigDecimal valore) {
        return NumberFormat.getCurrencyInstance(Locale.ITALY).format(valore);
    }

    private AvvisoDto toDto(Avviso a) {
        boolean notificato = a.getSogliaUltimaNotifica() != null
                && a.getSoglia().compareTo(a.getSogliaUltimaNotifica()) >= 0;
        return new AvvisoDto(a.getId(), a.getPreferito().getId(), a.getSoglia(), a.isAttivo(), notificato,
                a.getCreatedAt(), a.getUpdatedAt(), autoMapper.toCardDto(a.getPreferito().getAuto()));
    }
}
