package com.example.be.repositories;

import com.example.be.entities.Auto;
import com.example.be.enums.StatoPubblicazione;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface AutoRepository extends JpaRepository<Auto, UUID>, JpaSpecificationExecutor<Auto> {

    Optional<Auto> findByIdAndStatoPubblicazione(UUID id, StatoPubblicazione statoPubblicazione);

    boolean existsByListingId(String listingId);

    Page<Auto> findByStatoPubblicazione(StatoPubblicazione statoPubblicazione, Pageable pageable);
}
