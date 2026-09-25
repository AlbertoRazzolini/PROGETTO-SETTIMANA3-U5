package com.example.be.controllers;

import com.example.be.dto.PaginaDto;
import com.example.be.dto.avvisi.AvvisoCreateDto;
import com.example.be.dto.avvisi.AvvisoDto;
import com.example.be.dto.avvisi.AvvisoUpdateDto;
import com.example.be.security.UtenteAutenticato;
import com.example.be.services.AvvisoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

// Avvisi di prezzo dell'utente collegato. Chi prova /api/avvisi/{id} di un altro utente riceve 404.
@RestController
@RequestMapping("/api/avvisi")
@RequiredArgsConstructor
public class AvvisoController {

    private final AvvisoService avvisoService;

    // GET /api/avvisi?page=0 -> 200
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public PaginaDto<AvvisoDto> elenca(@AuthenticationPrincipal UtenteAutenticato utente,
                                       @RequestParam(defaultValue = "0") @Min(0) int page) {
        return avvisoService.elenca(utente.id(), page);
    }

    // POST /api/avvisi -> 201
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AvvisoDto crea(@AuthenticationPrincipal UtenteAutenticato utente,
                          @RequestBody @Valid AvvisoCreateDto dto) {
        return avvisoService.crea(utente.id(), dto.preferitoId(), dto.soglia());
    }

    // PUT /api/avvisi/{id} -> 200 (nuova soglia)
    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public AvvisoDto aggiorna(@AuthenticationPrincipal UtenteAutenticato utente,
                              @PathVariable UUID id,
                              @RequestBody @Valid AvvisoUpdateDto dto) {
        return avvisoService.aggiornaSoglia(utente.id(), id, dto.soglia());
    }

    // DELETE /api/avvisi/{id} -> 204
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void elimina(@AuthenticationPrincipal UtenteAutenticato utente, @PathVariable UUID id) {
        avvisoService.elimina(utente.id(), id);
    }
}
