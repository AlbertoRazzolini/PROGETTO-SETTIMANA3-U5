package com.example.be.services;

import com.example.be.exceptions.ErroriPerLog;
import com.example.be.dto.PaginaDto;
import com.example.be.dto.notifiche.ConteggioNotificheDto;
import com.example.be.dto.notifiche.NotificaDto;
import com.example.be.entities.Auto;
import com.example.be.entities.Notifica;
import com.example.be.entities.User;
import com.example.be.exceptions.NotFoundException;
import com.example.be.repositories.NotificaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificaService {

    // Coda personale: il client si iscrive a /user/queue/notifiche
    public static final String CODA_NOTIFICHE = "/queue/notifiche";

    private final NotificaRepository notificaRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Salva la notifica (resta consultabile anche se l'utente non era collegato)
     * e la invia in tempo reale via WebSocket, solo dopo il commit della transazione:
     * cosi' il client non riceve mai una notifica che poi non esiste nel DB.
     */
    @Transactional
    public void crea(User user, Auto auto, String messaggio) {
        Notifica notifica = notificaRepository.saveAndFlush(new Notifica(user, auto, messaggio));
        NotificaDto dto = NotificaDto.from(notifica);
        String destinatario = user.getId().toString();

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    inviaTempoReale(destinatario, dto);
                }
            });
        } else {
            inviaTempoReale(destinatario, dto);
        }
    }

    @Transactional(readOnly = true)
    public PaginaDto<NotificaDto> elenca(UUID userId, boolean soloNonLette, int pagina) {
        PageRequest pageable = PageRequest.of(pagina, AutoService.DIMENSIONE_PAGINA,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by("id")));
        Page<Notifica> page = soloNonLette
                ? notificaRepository.findByUserIdAndLettaFalse(userId, pageable)
                : notificaRepository.findByUserId(userId, pageable);
        return PaginaDto.da(page, NotificaDto::from);
    }

    @Transactional(readOnly = true)
    public ConteggioNotificheDto conteggio(UUID userId) {
        return new ConteggioNotificheDto(notificaRepository.countByUserIdAndLettaFalse(userId));
    }

    // Cercata per id E proprietario: la notifica di un altro utente risponde 404
    @Transactional
    public void segnaLetta(UUID userId, UUID notificaId) {
        Notifica notifica = notificaRepository.findByIdAndUserId(notificaId, userId)
                .orElseThrow(() -> new NotFoundException("Notifica non trovata"));
        notifica.setLetta(true);
    }

    @Transactional
    public void segnaTutteLette(UUID userId) {
        notificaRepository.segnaTutteLette(userId);
    }

    // Se l'utente non e' collegato il messaggio semplicemente non viene consegnato:
    // la notifica resta comunque nel DB e la vedra' al prossimo accesso
    private void inviaTempoReale(String userId, NotificaDto dto) {
        try {
            messagingTemplate.convertAndSendToUser(userId, CODA_NOTIFICHE, dto);
        } catch (MessagingException e) {
            log.warn("Invio notifica in tempo reale fallito (notifica id {}): {}", dto.id(), ErroriPerLog.descrivi(e));
        }
    }
}
