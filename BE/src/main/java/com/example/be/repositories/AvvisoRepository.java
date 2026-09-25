package com.example.be.repositories;

import com.example.be.entities.Avviso;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

// Avvisi cercati sempre per identificativo E proprietario insieme
// (il proprietario si raggiunge tramite il preferito: avviso.preferito.user)
public interface AvvisoRepository extends JpaRepository<Avviso, UUID> {

    @EntityGraph(attributePaths = {"preferito", "preferito.auto"})
    Page<Avviso> findByPreferitoUserId(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = {"preferito", "preferito.auto"})
    Optional<Avviso> findByIdAndPreferitoUserId(UUID id, UUID userId);

    boolean existsByPreferitoId(UUID preferitoId);

    Optional<Avviso> findByTokenDisattivazione(String tokenDisattivazione);

    @EntityGraph(attributePaths = {"preferito", "preferito.user", "preferito.auto"})
    List<Avviso> findByPreferitoAutoIdAndAttivoTrue(UUID autoId);
}
