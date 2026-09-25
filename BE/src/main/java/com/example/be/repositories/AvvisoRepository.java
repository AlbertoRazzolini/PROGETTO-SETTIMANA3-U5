package com.example.be.repositories;

import com.example.be.entities.Avviso;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

// Avvisi cercati sempre per identificativo E proprietario insieme
// (il proprietario si raggiunge tramite il preferito: avviso.preferito.user)
public interface AvvisoRepository extends JpaRepository<Avviso, UUID> {

    Page<Avviso> findByPreferitoUserId(UUID userId, Pageable pageable);

    Optional<Avviso> findByIdAndPreferitoUserId(UUID id, UUID userId);

    Optional<Avviso> findByPreferitoId(UUID preferitoId);

    Optional<Avviso> findByTokenDisattivazione(String tokenDisattivazione);

    List<Avviso> findByPreferitoAutoIdAndAttivoTrue(UUID autoId);
}
