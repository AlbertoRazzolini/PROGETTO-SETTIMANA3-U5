package com.example.be.repositories;

import com.example.be.entities.Preferito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

// Preferiti cercati sempre per identificativo E proprietario insieme
public interface PreferitoRepository extends JpaRepository<Preferito, UUID> {

    Page<Preferito> findByUserId(UUID userId, Pageable pageable);

    Optional<Preferito> findByIdAndUserId(UUID id, UUID userId);

    Optional<Preferito> findByUserIdAndAutoId(UUID userId, UUID autoId);

    boolean existsByUserIdAndAutoId(UUID userId, UUID autoId);
}
