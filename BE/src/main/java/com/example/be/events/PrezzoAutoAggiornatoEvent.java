package com.example.be.events;

import java.util.UUID;

// Pubblicato quando il prezzo di un'auto pubblicata cambia o quando un'auto viene pubblicata.
// Lo ascolta il servizio degli avvisi per controllare le soglie di prezzo degli utenti:
// cosi' la gestione annunci non dipende direttamente da avvisi, mail e notifiche.
public record PrezzoAutoAggiornatoEvent(UUID autoId) {
}
