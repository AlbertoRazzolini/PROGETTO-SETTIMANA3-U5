package com.example.be.services;

import com.example.be.dto.PaginaDto;
import com.example.be.dto.auto.AutoCardDto;
import com.example.be.dto.auto.AutoDettaglioDto;
import com.example.be.entities.Auto;
import com.example.be.enums.StatoAuto;
import com.example.be.enums.StatoPubblicazione;
import com.example.be.exceptions.BadRequestException;
import com.example.be.exceptions.NotFoundException;
import com.example.be.repositories.AutoRepository;
import com.example.be.repositories.AutoSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

// Vetrina pubblica: accessibile anche senza login, mostra SOLO le auto pubblicate
@Service
@RequiredArgsConstructor
public class AutoService {

    public static final int DIMENSIONE_PAGINA = 10;
    private static final int MAX_SUGGERIMENTI = 8;

    private final AutoRepository autoRepository;
    private final AutoMapper autoMapper;

    @Transactional(readOnly = true)
    public PaginaDto<AutoCardDto> cerca(String q, StatoAuto stato, String carburante,
                                        BigDecimal prezzoMin, BigDecimal prezzoMax,
                                        int pagina, String sort) {
        if (prezzoMin != null && prezzoMax != null && prezzoMin.compareTo(prezzoMax) > 0) {
            throw new BadRequestException("Il prezzo minimo non puo' superare il prezzo massimo");
        }
        Specification<Auto> filtri = Specification.allOf(
                AutoSpecifications.pubblicate(),
                AutoSpecifications.testo(q),
                AutoSpecifications.stato(stato),
                AutoSpecifications.carburante(carburante),
                AutoSpecifications.prezzoMin(prezzoMin),
                AutoSpecifications.prezzoMax(prezzoMax)
        );
        // Pagine da 10 elementi fisse, come da requisiti
        PageRequest pageable = PageRequest.of(pagina, DIMENSIONE_PAGINA, OrdinamentoAuto.da(sort));
        return PaginaDto.da(autoRepository.findAll(filtri, pageable), autoMapper::toCardDto);
    }

    // Un'auto in bozza risponde 404 come se non esistesse
    @Transactional(readOnly = true)
    public AutoDettaglioDto dettaglio(UUID id) {
        return autoRepository.findByIdAndStatoPubblicazione(id, StatoPubblicazione.PUBBLICATO)
                .map(autoMapper::toDettaglioDto)
                .orElseThrow(() -> new NotFoundException("Auto non trovata"));
    }

    @Transactional(readOnly = true)
    public List<String> suggerimenti(String q) {
        String pattern = AutoSpecifications.contiene(q.trim().toLowerCase(Locale.ROOT));
        return autoRepository.suggerimenti(StatoPubblicazione.PUBBLICATO, pattern, PageRequest.of(0, MAX_SUGGERIMENTI));
    }
}
