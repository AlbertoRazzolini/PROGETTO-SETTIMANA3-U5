package com.example.be.repositories;

import com.example.be.entities.Preferito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

// Preferiti cercati sempre per identificativo E proprietario insieme
public interface PreferitoRepository extends JpaRepository<Preferito, UUID> {

    // EntityGraph: carica l'auto insieme al preferito (una query invece di una per riga)
    @EntityGraph(attributePaths = "auto")
    Page<Preferito> findByUserId(UUID userId, Pageable pageable);

    Optional<Preferito> findByIdAndUserId(UUID id, UUID userId);

    Optional<Preferito> findByUserIdAndAutoId(UUID userId, UUID autoId);

    boolean existsByUserIdAndAutoId(UUID userId, UUID autoId);
}
