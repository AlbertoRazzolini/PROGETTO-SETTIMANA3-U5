package com.example.be.services;

import com.example.be.exceptions.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.domain.Sort;

import static org.junit.jupiter.api.Assertions.*;

class OrdinamentoAutoTest {

    @Test
    void defaultDataDecrescente() {
        Sort sort = OrdinamentoAuto.da(null);
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("createdAt").getDirection());
    }

    @Test
    void campoAmmessoConDirezione() {
        Sort sort = OrdinamentoAuto.da("Prezzo,DESC");
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("prezzo").getDirection());
        assertNotNull(sort.getOrderFor("id"), "secondo criterio stabile");
    }

    @Test
    void aliasDataMappatoSulCampoDellEntita() {
        assertNotNull(OrdinamentoAuto.da("data,asc").getOrderFor("createdAt"));
    }

    // Tutto cio' che non e' nell'elenco chiuso viene rifiutato
    @ParameterizedTest
    @ValueSource(strings = {"password", "prezzo; drop table users", "prezzo,sideways", "prezzo,asc,km", "createdAt", "id"})
    void valoriNonAmmessi(String sort) {
        assertThrows(BadRequestException.class, () -> OrdinamentoAuto.da(sort));
    }
}
