package com.example.be.repositories;

import com.example.be.entities.User;
import com.example.be.enums.Ruolo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByRuolo(Ruolo ruolo, Pageable pageable);
}
