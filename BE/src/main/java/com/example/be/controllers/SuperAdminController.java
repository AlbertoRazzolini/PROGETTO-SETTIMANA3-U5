package com.example.be.controllers;

import com.example.be.dto.PaginaDto;
import com.example.be.dto.RuoloUpdateDto;
import com.example.be.dto.UserResponseDto;
import com.example.be.enums.Ruolo;
import com.example.be.security.UtenteAutenticato;
import com.example.be.services.SuperAdminService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

// Solo SUPER_ADMIN (regola su /api/superadmin/**): ADMIN e USER ricevono 403
@RestController
@RequestMapping("/api/superadmin/utenti")
@RequiredArgsConstructor
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    // GET /api/superadmin/utenti?ruolo=ADMIN&page=0 -> 200
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public PaginaDto<UserResponseDto> elenca(@RequestParam(required = false) Ruolo ruolo,
                                             @RequestParam(defaultValue = "0") @Min(0) int page) {
        return superAdminService.elencaUtenti(ruolo, page);
    }

    // PATCH /api/superadmin/utenti/{id}/ruolo -> 200 con l'utente aggiornato
    @PatchMapping("/{id}/ruolo")
    @ResponseStatus(HttpStatus.OK)
    public UserResponseDto cambiaRuolo(@AuthenticationPrincipal UtenteAutenticato utente,
                                       @PathVariable UUID id,
                                       @RequestBody @Valid RuoloUpdateDto dto) {
        return superAdminService.cambiaRuolo(utente.id(), id, dto.ruolo());
    }
}
