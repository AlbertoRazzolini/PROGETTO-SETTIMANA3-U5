package com.example.be.config;

import com.example.be.entities.User;
import com.example.be.enums.Ruolo;
import com.example.be.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

// All'avvio crea, se non esistono gia', un utente per ogni ruolo (USER, ADMIN, SUPER_ADMIN),
// cosi' chi corregge puo' provare subito tutte le funzionalita'.
// Idempotente: ai riavvii successivi non duplica ne' sovrascrive nulla.
@Slf4j
@Component
@RequiredArgsConstructor
public class UserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.user.email}")
    private String userEmail;
    @Value("${app.seed.user.password}")
    private String userPassword;

    @Value("${app.seed.admin.email}")
    private String adminEmail;
    @Value("${app.seed.admin.password}")
    private String adminPassword;

    @Value("${app.seed.superadmin.email}")
    private String superAdminEmail;
    @Value("${app.seed.superadmin.password}")
    private String superAdminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        creaSeAssente("Mario", "Rossi", userEmail, userPassword, Ruolo.USER);
        creaSeAssente("Giulia", "Bianchi", adminEmail, adminPassword, Ruolo.ADMIN);
        creaSeAssente("Luca", "Verdi", superAdminEmail, superAdminPassword, Ruolo.SUPER_ADMIN);
    }

    private void creaSeAssente(String nome, String cognome, String email, String password, Ruolo ruolo) {
        String emailNormalizzata = email.trim().toLowerCase();
        if (userRepository.existsByEmail(emailNormalizzata)) {
            return;
        }
        // La password viene salvata solo come hash BCrypt
        User user = new User(nome, cognome, emailNormalizzata, passwordEncoder.encode(password), ruolo);
        userRepository.save(user);
        // Nei log solo ruolo e id: mai email ne' password
        log.info("Seeder: creato utente con ruolo {} (id {})", ruolo, user.getId());
    }
}
