package com.example.be.repositories;

import com.example.be.entities.Avviso;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

// Avvisi cercati sempre per identificativo E proprietario insieme
public interface AvvisoRepository extends JpaRepository<Avviso, UUID> {

    Page<Avviso> findByUserId(UUID userId, Pageable pageable);

    Optional<Avviso> findByIdAndUserId(UUID id, UUID userId);

    Optional<Avviso> findByUserIdAndAutoId(UUID userId, UUID autoId);

    Optional<Avviso> findByTokenDisattivazione(String tokenDisattivazione);

    List<Avviso> findByAutoIdAndAttivoTrue(UUID autoId);
}
