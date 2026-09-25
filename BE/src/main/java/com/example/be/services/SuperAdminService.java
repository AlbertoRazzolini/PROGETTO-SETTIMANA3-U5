package com.example.be.services;

import com.example.be.dto.PaginaDto;
import com.example.be.dto.UserResponseDto;
import com.example.be.entities.User;
import com.example.be.enums.Ruolo;
import com.example.be.exceptions.BadRequestException;
import com.example.be.exceptions.NotFoundException;
import com.example.be.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PaginaDto<UserResponseDto> elencaUtenti(Ruolo ruolo, int pagina) {
        PageRequest pageable = PageRequest.of(pagina, AutoService.DIMENSIONE_PAGINA,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by("id")));
        Page<User> page = ruolo == null
                ? userRepository.findAll(pageable)
                : userRepository.findByRuolo(ruolo, pageable);
        return PaginaDto.da(page, UserResponseDto::from);
    }

    /**
     * Cambio ruolo di un utente. Vale subito, anche con il token gia' emesso:
     * il filtro JWT rilegge il ruolo dal DB a ogni richiesta.
     * Il super-admin non puo' cambiare il proprio ruolo: cosi' non si resta mai senza super-admin.
     */
    @Transactional
    public UserResponseDto cambiaRuolo(UUID richiedenteId, UUID userId, Ruolo nuovoRuolo) {
        if (richiedenteId.equals(userId)) {
            throw new BadRequestException("Non puoi modificare il tuo stesso ruolo");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        Ruolo precedente = user.getRuolo();
        user.setRuolo(nuovoRuolo);
        log.info("Ruolo utente id {} cambiato da {} a {} (dal super-admin id {})",
                userId, precedente, nuovoRuolo, richiedenteId);
        return UserResponseDto.from(user);
    }
}
