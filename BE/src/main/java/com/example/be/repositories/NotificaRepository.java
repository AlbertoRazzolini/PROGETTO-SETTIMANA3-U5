package com.example.be.repositories;

import com.example.be.entities.Notifica;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

// Notifiche cercate sempre per identificativo E proprietario insieme
public interface NotificaRepository extends JpaRepository<Notifica, UUID> {

    @EntityGraph(attributePaths = "auto")
    Page<Notifica> findByUserId(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = "auto")
    Page<Notifica> findByUserIdAndLettaFalse(UUID userId, Pageable pageable);

    Optional<Notifica> findByIdAndUserId(UUID id, UUID userId);

    long countByUserIdAndLettaFalse(UUID userId);

    @Modifying
    @Query("update Notifica n set n.letta = true where n.user.id = :userId and n.letta = false")
    int segnaTutteLette(@Param("userId") UUID userId);
}
