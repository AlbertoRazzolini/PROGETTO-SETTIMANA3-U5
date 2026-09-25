package com.example.be.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

// Abilita @Async: l'invio delle mail avviene in background, cosi' la richiesta dell'admin
// che cambia un prezzo non aspetta i tempi del server SMTP di Gmail
@Configuration
@EnableAsync
public class AsyncConfig {
}
