package com.example.be.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

// Formato stabile per tutte le risposte paginate (invece di serializzare direttamente Page di Spring)
public record PaginaDto<T>(
        List<T> contenuto,
        int pagina,
        int dimensione,
        long totaleElementi,
        int totalePagine
) {
    public static <E, T> PaginaDto<T> da(Page<E> page, Function<E, T> mapper) {
        return new PaginaDto<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
