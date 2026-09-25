package com.example.be.repositories;

import com.example.be.entities.Auto;
import com.example.be.enums.StatoPubblicazione;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AutoRepository extends JpaRepository<Auto, UUID>, JpaSpecificationExecutor<Auto> {

    Optional<Auto> findByIdAndStatoPubblicazione(UUID id, StatoPubblicazione statoPubblicazione);

    boolean existsByListingId(String listingId);

    Page<Auto> findByStatoPubblicazione(StatoPubblicazione statoPubblicazione, Pageable pageable);

    // Suggerimenti per la barra di ricerca: coppie "Marca Modello" distinte delle sole auto pubblicate.
    // Il testo dell'utente arriva come parametro (:pattern), gia' con i caratteri di LIKE resi letterali.
    @Query("""
            select distinct concat(a.marca, ' ', a.modello)
            from Auto a
            where a.statoPubblicazione = :stato
              and lower(concat(a.marca, ' ', a.modello)) like :pattern escape '\\'
            order by concat(a.marca, ' ', a.modello)
            """)
    List<String> suggerimenti(@Param("stato") StatoPubblicazione stato,
                              @Param("pattern") String pattern,
                              Pageable limite);
}
