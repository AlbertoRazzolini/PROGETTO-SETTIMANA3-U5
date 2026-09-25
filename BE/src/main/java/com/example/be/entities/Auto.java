package com.example.be.entities;

import com.example.be.enums.StatoAuto;
import com.example.be.enums.StatoPubblicazione;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "auto")
@Getter
@Setter
@NoArgsConstructor
public class Auto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Setter(AccessLevel.NONE)
    private UUID id;

    // ID dell'annuncio su auto.dev da cui l'auto e' stata importata
    @Column(name = "listing_id", nullable = false, unique = true)
    private String listingId;

    // vin, marca, modello, anno e carburante sono presenti anche nella scheda tecnica (jsonb):
    // duplicazione voluta. Ricerca, filtri, ordinamento (whitelist) e suggerimenti lavorano su
    // colonne normali, indicizzabili e interrogabili con query JPA parametrizzate, invece che con
    // SQL nativo sugli operatori jsonb di Postgres. Il mapping avviene una sola volta all'import,
    // quindi un cambio di nomi nel JSON di auto.dev non rompe i dati gia' salvati.
    @Column(length = 17)
    private String vin;

    private String marca;

    private String modello;

    private Integer anno;

    private String carburante;

    // Descrizione tradotta in italiano (modificabile dall'admin)
    @Column(columnDefinition = "TEXT")
    private String descrizione;

    // Snapshot completo dell'oggetto "vehicle" di auto.dev (scheda tecnica + optional)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "scheda_tecnica", columnDefinition = "jsonb")
    private String schedaTecnica;

    // BatchSize: in un elenco paginato le immagini di piu' auto si caricano con poche query invece di una per auto
    @ElementCollection
    @BatchSize(size = 20)
    @CollectionTable(name = "auto_immagini", joinColumns = @JoinColumn(name = "auto_id"))
    @OrderColumn(name = "posizione")
    @Column(name = "url", nullable = false, length = 1000)
    private List<String> immagini = new ArrayList<>();

    // Nullable finche' l'annuncio e' in bozza: obbligatorio per la pubblicazione
    @Min(0)
    @Max(999_999)
    private Integer km;

    @Column(precision = 9, scale = 2)
    private BigDecimal prezzo;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private StatoAuto stato;

    @Enumerated(EnumType.STRING)
    @Column(name = "stato_pubblicazione", nullable = false, length = 15)
    private StatoPubblicazione statoPubblicazione = StatoPubblicazione.BOZZA;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Setter(AccessLevel.NONE)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    @Setter(AccessLevel.NONE)
    private Instant updatedAt;
}
