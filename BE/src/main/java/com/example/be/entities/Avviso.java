package com.example.be.entities;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

// Soglia di prezzo impostata da un utente su un'auto tra i suoi preferiti.
// Relazione Preferito 1 -- 0..1 Avviso: la FK sta qui, quindi un preferito puo' non avere
// alcuna soglia, ma un avviso non puo' esistere senza il preferito (lo garantisce il DB).
// Utente e auto si ricavano dal preferito, senza duplicare la coppia (user_id, auto_id).
@Entity
@Table(name = "avvisi")
@Getter
@Setter
@NoArgsConstructor
public class Avviso {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Setter(AccessLevel.NONE)
    private UUID id;

    // Se l'utente toglie l'auto dai preferiti, il DB cancella anche l'avviso (ON DELETE CASCADE)
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "preferito_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @Setter(AccessLevel.NONE)
    private Preferito preferito;

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

    public Avviso(Preferito preferito, BigDecimal soglia) {
        this.preferito = preferito;
        this.soglia = soglia;
    }
}
