package com.example.be.repositories;

import com.example.be.entities.Notifica;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface NotificaRepository extends JpaRepository<Notifica, UUID> {

    Page<Notifica> findByUserId(UUID userId, Pageable pageable);

    Optional<Notifica> findByIdAndUserId(UUID id, UUID userId);

    long countByUserIdAndLettaFalse(UUID userId);
}
