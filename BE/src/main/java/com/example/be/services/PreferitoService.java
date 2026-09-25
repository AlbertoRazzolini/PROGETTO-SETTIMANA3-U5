package com.example.be.services;

import com.example.be.dto.PaginaDto;
import com.example.be.dto.preferiti.PreferitoDto;
import com.example.be.entities.Auto;
import com.example.be.entities.Preferito;
import com.example.be.enums.StatoPubblicazione;
import com.example.be.exceptions.ConflictException;
import com.example.be.exceptions.NotFoundException;
import com.example.be.repositories.AutoRepository;
import com.example.be.repositories.PreferitoRepository;
import com.example.be.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PreferitoService {

    private final PreferitoRepository preferitoRepository;
    private final AutoRepository autoRepository;
    private final UserRepository userRepository;
    private final AutoMapper autoMapper;

    @Transactional(readOnly = true)
    public PaginaDto<PreferitoDto> elenca(UUID userId, int pagina) {
        PageRequest pageable = PageRequest.of(pagina, AutoService.DIMENSIONE_PAGINA,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by("id")));
        return PaginaDto.da(preferitoRepository.findByUserId(userId, pageable), this::toDto);
    }

    @Transactional
    public PreferitoDto aggiungi(UUID userId, UUID autoId) {
        // Si possono salvare solo auto visibili in vetrina: una bozza risponde 404 come se non esistesse
        Auto auto = autoRepository.findByIdAndStatoPubblicazione(autoId, StatoPubblicazione.PUBBLICATO)
                .orElseThrow(() -> new NotFoundException("Auto non trovata"));
        if (preferitoRepository.existsByUserIdAndAutoId(userId, autoId)) {
            throw new ConflictException("Auto gia' presente nei preferiti");
        }
        Preferito preferito = new Preferito(userRepository.getReferenceById(userId), auto);
        preferitoRepository.saveAndFlush(preferito);
        return toDto(preferito);
    }

    // Cercato per id E proprietario: il preferito di un altro utente risponde 404.
    // L'eventuale avviso di prezzo collegato viene cancellato dal DB (ON DELETE CASCADE).
    @Transactional
    public void rimuovi(UUID userId, UUID preferitoId) {
        Preferito preferito = preferitoRepository.findByIdAndUserId(preferitoId, userId)
                .orElseThrow(() -> new NotFoundException("Preferito non trovato"));
        preferitoRepository.delete(preferito);
    }

    private PreferitoDto toDto(Preferito p) {
        Auto auto = p.getAuto();
        return new PreferitoDto(p.getId(), p.getCreatedAt(),
                auto.getStatoPubblicazione() == StatoPubblicazione.PUBBLICATO,
                autoMapper.toCardDto(auto));
    }
}
