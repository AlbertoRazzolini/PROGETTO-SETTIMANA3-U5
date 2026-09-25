package com.example.be.controllers;

import com.example.be.dto.PaginaDto;
import com.example.be.dto.auto.AutoAdminDto;
import com.example.be.dto.auto.AutoUpdateDto;
import com.example.be.dto.auto.ImportAutoDto;
import com.example.be.dto.auto.PrezzoUpdateDto;
import com.example.be.enums.StatoPubblicazione;
import com.example.be.services.AutoAdminService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

// Gestione annunci: solo ADMIN (e SUPER_ADMIN per gerarchia). Un USER riceve 403 (regola su /api/admin/**).
@RestController
@RequestMapping("/api/admin/auto")
@RequiredArgsConstructor
public class AutoAdminController {

    private final AutoAdminService autoAdminService;

    // POST /api/admin/auto/import -> 201 (annuncio creato come bozza)
    @PostMapping("/import")
    @ResponseStatus(HttpStatus.CREATED)
    public AutoAdminDto importa(@RequestBody @Valid ImportAutoDto dto) {
        return autoAdminService.importa(dto.listingId());
    }

    // GET /api/admin/auto?stato=BOZZA&page=0&size=10&sort=prezzo,desc -> 200 (bozze comprese)
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public PaginaDto<AutoAdminDto> elenca(
            @RequestParam(required = false) StatoPubblicazione stato,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size,
            @RequestParam(required = false) String sort) {
        return autoAdminService.elenca(stato, page, size, sort);
    }

    // GET /api/admin/auto/{id} -> 200
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public AutoAdminDto dettaglio(@PathVariable UUID id) {
        return autoAdminService.dettaglio(id);
    }

    // PUT /api/admin/auto/{id} -> 200 (km, prezzo, stato, descrizione)
    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public AutoAdminDto aggiorna(@PathVariable UUID id, @RequestBody @Valid AutoUpdateDto dto) {
        return autoAdminService.aggiorna(id, dto);
    }

    // PATCH /api/admin/auto/{id}/prezzo -> 200
    @PatchMapping("/{id}/prezzo")
    @ResponseStatus(HttpStatus.OK)
    public AutoAdminDto aggiornaPrezzo(@PathVariable UUID id, @RequestBody @Valid PrezzoUpdateDto dto) {
        return autoAdminService.aggiornaPrezzo(id, dto.prezzo());
    }

    // PATCH /api/admin/auto/{id}/pubblica -> 200
    @PatchMapping("/{id}/pubblica")
    @ResponseStatus(HttpStatus.OK)
    public AutoAdminDto pubblica(@PathVariable UUID id) {
        return autoAdminService.pubblica(id);
    }

    // PATCH /api/admin/auto/{id}/bozza -> 200
    @PatchMapping("/{id}/bozza")
    @ResponseStatus(HttpStatus.OK)
    public AutoAdminDto mettiInBozza(@PathVariable UUID id) {
        return autoAdminService.mettiInBozza(id);
    }
}
