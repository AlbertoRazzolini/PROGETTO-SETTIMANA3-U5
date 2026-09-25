package com.example.be.controllers;

import com.example.be.dto.PaginaDto;
import com.example.be.dto.auto.AutoCardDto;
import com.example.be.dto.auto.AutoDettaglioDto;
import com.example.be.enums.StatoAuto;
import com.example.be.services.AutoService;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

// Vetrina pubblica (GET /api/auto/** e' permitAll: consultabile anche da utenti non registrati)
@RestController
@RequestMapping("/api/auto")
@RequiredArgsConstructor
public class AutoController {

    private final AutoService autoService;

    // GET /api/auto?q=subaru&stato=USATO&carburante=Benzina&prezzoMin=10000&prezzoMax=40000&page=0&sort=prezzo,asc
    // -> 200, pagine da 10 elementi
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public PaginaDto<AutoCardDto> cerca(
            @RequestParam(required = false) @Size(max = 50, message = "Testo di ricerca troppo lungo") String q,
            @RequestParam(required = false) StatoAuto stato,
            @RequestParam(required = false) @Size(max = 30) String carburante,
            @RequestParam(required = false) @DecimalMin(value = "0", message = "Prezzo minimo non valido") BigDecimal prezzoMin,
            @RequestParam(required = false) @DecimalMin(value = "0", message = "Prezzo massimo non valido") BigDecimal prezzoMax,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(required = false) String sort) {
        return autoService.cerca(q, stato, carburante, prezzoMin, prezzoMax, page, sort);
    }

    // GET /api/auto/suggerimenti?q=sub -> 200, suggerimenti per il menu a tendina (dalla 3a lettera)
    @GetMapping("/suggerimenti")
    @ResponseStatus(HttpStatus.OK)
    public List<String> suggerimenti(
            @RequestParam @NotBlank @Size(min = 3, max = 50, message = "Servono almeno 3 caratteri") String q) {
        return autoService.suggerimenti(q);
    }

    // GET /api/auto/{id} -> 200 (404 se inesistente o non pubblicata)
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public AutoDettaglioDto dettaglio(@PathVariable UUID id) {
        return autoService.dettaglio(id);
    }
}
