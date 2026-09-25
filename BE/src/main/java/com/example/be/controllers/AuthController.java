package com.example.be.controllers;

import com.example.be.dto.LoginRequestDto;
import com.example.be.dto.LoginResponseDto;
import com.example.be.dto.RegisterRequestDto;
import com.example.be.dto.UserResponseDto;
import com.example.be.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/register -> 201 Created
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponseDto register(@RequestBody @Valid RegisterRequestDto dto) {
        return authService.registra(dto);
    }

    // POST /api/auth/login -> 200 OK con token JWT
    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public LoginResponseDto login(@RequestBody @Valid LoginRequestDto dto) {
        return authService.login(dto);
    }
}
