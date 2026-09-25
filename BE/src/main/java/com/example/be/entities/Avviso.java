package com.example.be.entities;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

// Soglia di prezzo impostata da un utente su un'auto tra i suoi preferiti
@Entity
@Table(name = "avvisi", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "auto_id"}))
@Getter
@Setter
@NoArgsConstructor
public class Avviso {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Setter(AccessLevel.NONE)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @Setter(AccessLevel.NONE)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auto_id", nullable = false)
    @Setter(AccessLevel.NONE)
    private Auto auto;

    @Column(nullable = false, precision = 9, scale = 2)
    private BigDecimal soglia;

    // Soglia per cui e' gia' stata inviata la mail: si rimanda solo se l'utente
    // imposta una soglia piu' bassa e il prezzo ci scende di nuovo sotto
    @Column(name = "soglia_ultima_notifica", precision = 9, scale = 2)
    private BigDecimal sogliaUltimaNotifica;

    @Column(nullable = false)
    private boolean attivo = true;

    // Token casuale e monouso per il link "disattiva avviso" nella mail (mai l'id)
    @Column(name = "token_disattivazione", unique = true, length = 64)
    private String tokenDisattivazione;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Setter(AccessLevel.NONE)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    @Setter(AccessLevel.NONE)
    private Instant updatedAt;

    public Avviso(User user, Auto auto, BigDecimal soglia) {
        this.user = user;
        this.auto = auto;
        this.soglia = soglia;
    }
}
