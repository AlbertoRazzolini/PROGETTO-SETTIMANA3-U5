package com.example.be.controllers;

import com.example.be.dto.PaginaDto;
import com.example.be.dto.notifiche.ConteggioNotificheDto;
import com.example.be.dto.notifiche.NotificaDto;
import com.example.be.security.UtenteAutenticato;
import com.example.be.services.NotificaService;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

// Storico notifiche dell'utente collegato (quelle in tempo reale arrivano via WebSocket)
@RestController
@RequestMapping("/api/notifiche")
@RequiredArgsConstructor
public class NotificaController {

    private final NotificaService notificaService;

    // GET /api/notifiche?page=0&nonLette=true -> 200
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public PaginaDto<NotificaDto> elenca(@AuthenticationPrincipal UtenteAutenticato utente,
                                         @RequestParam(defaultValue = "false") boolean nonLette,
                                         @RequestParam(defaultValue = "0") @Min(0) int page) {
        return notificaService.elenca(utente.id(), nonLette, page);
    }

    // GET /api/notifiche/conteggio -> 200 { "nonLette": n }
    @GetMapping("/conteggio")
    @ResponseStatus(HttpStatus.OK)
    public ConteggioNotificheDto conteggio(@AuthenticationPrincipal UtenteAutenticato utente) {
        return notificaService.conteggio(utente.id());
    }

    // PATCH /api/notifiche/{id}/letta -> 204 (404 se non esiste o e' di un altro utente)
    @PatchMapping("/{id}/letta")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void segnaLetta(@AuthenticationPrincipal UtenteAutenticato utente, @PathVariable UUID id) {
        notificaService.segnaLetta(utente.id(), id);
    }

    // PATCH /api/notifiche/lette -> 204 (segna tutte come lette)
    @PatchMapping("/lette")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void segnaTutteLette(@AuthenticationPrincipal UtenteAutenticato utente) {
        notificaService.segnaTutteLette(utente.id());
    }
}
