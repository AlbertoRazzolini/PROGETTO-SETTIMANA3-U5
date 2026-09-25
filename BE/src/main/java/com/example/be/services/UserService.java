package com.example.be.services;

import com.example.be.dto.CambioPasswordDto;
import com.example.be.dto.ProfiloUpdateDto;
import com.example.be.dto.UserResponseDto;
import com.example.be.entities.User;
import com.example.be.exceptions.BadRequestException;
import com.example.be.exceptions.NotFoundException;
import com.example.be.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User trovaPerId(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }

    @Transactional(readOnly = true)
    public UserResponseDto getProfilo(UUID userId) {
        return UserResponseDto.from(trovaPerId(userId));
    }

    @Transactional
    public UserResponseDto aggiornaProfilo(UUID userId, ProfiloUpdateDto dto) {
        User user = trovaPerId(userId);
        user.setNome(dto.nome().trim());
        user.setCognome(dto.cognome().trim());
        return UserResponseDto.from(user);
    }

    @Transactional
    public void cambiaPassword(UUID userId, CambioPasswordDto dto) {
        User user = trovaPerId(userId);
        // 400 e non 401: l'utente e' autenticato, e' solo il dato inserito a essere sbagliato
        if (!passwordEncoder.matches(dto.passwordAttuale(), user.getPassword())) {
            throw new BadRequestException("La password attuale non e' corretta");
        }
        user.setPassword(passwordEncoder.encode(dto.nuovaPassword()));
        log.info("Password aggiornata per utente id {}", userId);
    }
}
