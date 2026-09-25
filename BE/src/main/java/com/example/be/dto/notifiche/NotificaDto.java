package com.example.be.dto.notifiche;

import com.example.be.entities.Notifica;

import java.time.Instant;
import java.util.UUID;

// Usato sia nella risposta REST sia nel messaggio WebSocket in tempo reale
public record NotificaDto(
        UUID id,
        String messaggio,
        boolean letta,
        Instant createdAt,
        UUID autoId,
        String marca,
        String modello
) {
    public static NotificaDto from(Notifica n) {
        return new NotificaDto(n.getId(), n.getMessaggio(), n.isLetta(), n.getCreatedAt(),
                n.getAuto().getId(), n.getAuto().getMarca(), n.getAuto().getModello());
    }
}
