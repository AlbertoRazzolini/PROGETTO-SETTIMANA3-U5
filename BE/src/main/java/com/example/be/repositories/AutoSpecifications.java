package com.example.be.repositories;

import com.example.be.entities.Auto;
import com.example.be.enums.StatoAuto;
import com.example.be.enums.StatoPubblicazione;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

// Filtri della ricerca in vetrina costruiti con la Criteria API: ogni valore del client diventa un
// PARAMETRO della query (bind), niente concatenazione di stringhe SQL/JPQL.
// Un filtro non impostato restituisce Specification.unrestricted() (nessun vincolo).
public final class AutoSpecifications {

    // Carattere di escape per LIKE: % e _ scritti dall'utente vanno cercati letteralmente, non come jolly
    public static final char ESCAPE = '\\';

    private AutoSpecifications() {
    }

    public static Specification<Auto> pubblicate() {
        return (root, query, cb) -> cb.equal(root.get("statoPubblicazione"), StatoPubblicazione.PUBBLICATO);
    }

    // Ogni parola del testo deve comparire nella marca o nel modello (es. "subaru outb")
    public static Specification<Auto> testo(String q) {
        if (q == null || q.isBlank()) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> {
            Expression<String> marca = cb.lower(cb.coalesce(root.get("marca"), ""));
            Expression<String> modello = cb.lower(cb.coalesce(root.get("modello"), ""));
            List<Predicate> parole = new ArrayList<>();
            for (String parola : q.trim().toLowerCase(Locale.ROOT).split("\\s+")) {
                String pattern = contiene(parola);
                parole.add(cb.or(cb.like(marca, pattern, ESCAPE), cb.like(modello, pattern, ESCAPE)));
            }
            return cb.and(parole.toArray(Predicate[]::new));
        };
    }

    public static Specification<Auto> stato(StatoAuto stato) {
        return stato == null ? Specification.unrestricted() : (root, query, cb) -> cb.equal(root.get("stato"), stato);
    }

    public static Specification<Auto> carburante(String carburante) {
        if (carburante == null || carburante.isBlank()) {
            return Specification.unrestricted();
        }
        String valore = carburante.trim().toLowerCase(Locale.ROOT);
        return (root, query, cb) -> cb.equal(cb.lower(root.get("carburante")), valore);
    }

    public static Specification<Auto> prezzoMin(BigDecimal min) {
        return min == null ? Specification.unrestricted() : (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("prezzo"), min);
    }

    public static Specification<Auto> prezzoMax(BigDecimal max) {
        return max == null ? Specification.unrestricted() : (root, query, cb) -> cb.lessThanOrEqualTo(root.get("prezzo"), max);
    }

    // "%testo%" con i caratteri speciali di LIKE resi letterali
    public static String contiene(String testo) {
        String escaped = testo
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
