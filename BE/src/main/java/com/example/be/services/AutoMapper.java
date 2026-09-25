package com.example.be.services;

import com.example.be.dto.auto.AutoAdminDto;
import com.example.be.entities.Auto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

// Conversione entita' Auto -> DTO di risposta (l'entita' non esce mai dai controller)
@Component
@RequiredArgsConstructor
public class AutoMapper {

    private final ObjectMapper objectMapper;

    // Da chiamare dentro una transazione: legge la collection lazy delle immagini
    public AutoAdminDto toAdminDto(Auto a) {
        return new AutoAdminDto(
                a.getId(), a.getListingId(), a.getVin(), a.getMarca(), a.getModello(), a.getAnno(),
                a.getCarburante(), a.getDescrizione(), schedaTecnica(a), List.copyOf(a.getImmagini()),
                a.getKm(), a.getPrezzo(), a.getStato(), a.getStatoPubblicazione(),
                a.getCreatedAt(), a.getUpdatedAt()
        );
    }

    // La scheda tecnica e' salvata come JSON (jsonb): la si restituisce come oggetto, non come stringa
    public JsonNode schedaTecnica(Auto a) {
        if (a.getSchedaTecnica() == null) {
            return null;
        }
        try {
            return objectMapper.readTree(a.getSchedaTecnica());
        } catch (JacksonException e) {
            return null;
        }
    }
}
