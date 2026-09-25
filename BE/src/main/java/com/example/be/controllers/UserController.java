package com.example.be.controllers;

import com.example.be.dto.CambioPasswordDto;
import com.example.be.dto.ProfiloUpdateDto;
import com.example.be.dto.UserResponseDto;
import com.example.be.security.UtenteAutenticato;
import com.example.be.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// Solo "/me": l'utente agisce sempre su se stesso, l'id arriva dal token e mai dal client
@RestController
@RequestMapping("/api/utenti/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET /api/utenti/me -> 200
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public UserResponseDto getProfilo(@AuthenticationPrincipal UtenteAutenticato utente) {
        return userService.getProfilo(utente.id());
    }

    // PUT /api/utenti/me -> 200 con il profilo aggiornato
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    public UserResponseDto aggiornaProfilo(@AuthenticationPrincipal UtenteAutenticato utente,
                                           @RequestBody @Valid ProfiloUpdateDto dto) {
        return userService.aggiornaProfilo(utente.id(), dto);
    }

    // PATCH /api/utenti/me/password -> 204 (nessun contenuto da restituire)
    @PatchMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cambiaPassword(@AuthenticationPrincipal UtenteAutenticato utente,
                               @RequestBody @Valid CambioPasswordDto dto) {
        userService.cambiaPassword(utente.id(), dto);
    }
}
