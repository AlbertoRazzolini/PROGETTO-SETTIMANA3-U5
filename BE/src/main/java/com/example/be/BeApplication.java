package com.example.be;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

// Escluso l'utente in-memory di default di Spring Boot (con password generata stampata nei log):
// l'autenticazione avviene solo tramite JWT sugli utenti del DB.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class BeApplication {

    public static void main(String[] args) {
        SpringApplication.run(BeApplication.class, args);
    }

}
