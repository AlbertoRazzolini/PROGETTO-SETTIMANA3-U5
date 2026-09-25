package com.example.be.services;

import com.example.be.dto.LoginRequestDto;
import com.example.be.dto.LoginResponseDto;
import com.example.be.dto.RegisterRequestDto;
import com.example.be.dto.UserResponseDto;
import com.example.be.entities.User;
import com.example.be.enums.Ruolo;
import com.example.be.exceptions.ConflictException;
import com.example.be.exceptions.UnauthorizedException;
import com.example.be.repositories.UserRepository;
import com.example.be.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String CREDENZIALI_NON_VALIDE = "Email o password non corretti";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public UserResponseDto registra(RegisterRequestDto dto) {
        String email = normalizzaEmail(dto.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email gia' registrata");
        }
        // Il ruolo lo decide il server: ogni nuova registrazione e' USER
        User user = new User(dto.nome().trim(), dto.cognome().trim(), email,
                passwordEncoder.encode(dto.password()), Ruolo.USER);
        // saveAndFlush: l'INSERT parte subito, cosi' @CreationTimestamp valorizza createdAt prima della risposta
        userRepository.saveAndFlush(user);
        log.info("Registrato nuovo utente id {}", user.getId());
        return UserResponseDto.from(user);
    }

    @Transactional(readOnly = true)
    public LoginResponseDto login(LoginRequestDto dto) {
        // Stesso messaggio sia per email inesistente sia per password errata:
        // chi prova non deve capire quali email sono registrate
        User user = userRepository.findByEmail(normalizzaEmail(dto.email()))
                .filter(u -> passwordEncoder.matches(dto.password(), u.getPassword()))
                .orElseThrow(() -> new UnauthorizedException(CREDENZIALI_NON_VALIDE));
        return new LoginResponseDto(jwtService.generaToken(user), UserResponseDto.from(user));
    }

    private String normalizzaEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
