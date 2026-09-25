package com.example.be.controllers;

import com.example.be.dto.autodev.AnnuncioAutoDevRiassuntoDto;
import com.example.be.dto.autodev.AnteprimaAnnuncioDto;
import com.example.be.services.AutoDevService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Consultazione di auto.dev riservata all'admin (sotto /api/admin/**): serve a trovare gli annunci da importare.
// Ogni chiamata consuma crediti auto.dev, per questo non e' esposta agli utenti.
@RestController
@RequestMapping("/api/admin/autodev")
@RequiredArgsConstructor
public class AutoDevAdminController {

    private static final String REGEX_TESTO_FILTRO = "^[\\p{L}\\p{N} .\\-]{1,40}$";

    private final AutoDevService autoDevService;

    // GET /api/admin/autodev/listings?make=Tesla&model=Model 3&page=2 -> 200
    // Una ricerca = 1 chiamata auto.dev, qualunque sia il numero di risultati: 20 per pagina di default,
    // che e' anche il massimo del piano Free. page parte da 1 (auto.dev pagina con page+limit fino a 100).
    @GetMapping("/listings")
    @ResponseStatus(HttpStatus.OK)
    public List<AnnuncioAutoDevRiassuntoDto> cerca(
            @RequestParam(required = false) @Pattern(regexp = REGEX_TESTO_FILTRO, message = "Marca non valida") String make,
            @RequestParam(required = false) @Pattern(regexp = REGEX_TESTO_FILTRO, message = "Modello non valido") String model,
            @RequestParam(required = false) @Min(1) @Max(20) Integer limit,
            @RequestParam(defaultValue = "1") @Min(1) @Max(100) int page) {
        return autoDevService.cerca(make, model, limit, page);
    }

    // GET /api/admin/autodev/listings/{listingId} -> 200
    // Anteprima dell'annuncio completo (dati + foto uniti, gia' in euro/km/italiano) prima dell'import
    @GetMapping("/listings/{listingId}")
    @ResponseStatus(HttpStatus.OK)
    public AnteprimaAnnuncioDto anteprima(
            @PathVariable @Pattern(regexp = "^[A-Za-z0-9]{5,32}$", message = "Listing ID non valido") String listingId) {
        return autoDevService.anteprima(listingId);
    }
}
