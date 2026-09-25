package com.example.be.controllers;

import com.example.be.dto.PaginaDto;
import com.example.be.dto.preferiti.PreferitoCreateDto;
import com.example.be.dto.preferiti.PreferitoDto;
import com.example.be.security.UtenteAutenticato;
import com.example.be.services.PreferitoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

// Solo utenti registrati: l'utente arriva sempre dal token, mai dal client
@RestController
@RequestMapping("/api/preferiti")
@RequiredArgsConstructor
public class PreferitoController {

    private final PreferitoService preferitoService;

    // GET /api/preferiti?page=0 -> 200 (solo i propri, 10 per pagina)
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public PaginaDto<PreferitoDto> elenca(@AuthenticationPrincipal UtenteAutenticato utente,
                                          @RequestParam(defaultValue = "0") @Min(0) int page) {
        return preferitoService.elenca(utente.id(), page);
    }

    // POST /api/preferiti -> 201
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PreferitoDto aggiungi(@AuthenticationPrincipal UtenteAutenticato utente,
                                 @RequestBody @Valid PreferitoCreateDto dto) {
        return preferitoService.aggiungi(utente.id(), dto.autoId());
    }

    // DELETE /api/preferiti/{id} -> 204 (404 se non esiste o appartiene a un altro utente)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rimuovi(@AuthenticationPrincipal UtenteAutenticato utente, @PathVariable UUID id) {
        preferitoService.rimuovi(utente.id(), id);
    }
}
