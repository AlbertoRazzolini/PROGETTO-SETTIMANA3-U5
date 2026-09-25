package com.example.be.services;

import com.example.be.entities.Auto;
import com.example.be.entities.Avviso;
import com.example.be.entities.Preferito;
import com.example.be.entities.User;
import com.example.be.enums.Ruolo;
import com.example.be.enums.StatoPubblicazione;
import com.example.be.exceptions.BadRequestException;
import com.example.be.repositories.AvvisoRepository;
import com.example.be.repositories.PreferitoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// La soglia di un avviso deve stare sotto il prezzo attuale: l'avviso segnala un ribasso
class AvvisoServiceTest {

    private final AvvisoRepository avvisoRepository = mock(AvvisoRepository.class);
    private final PreferitoRepository preferitoRepository = mock(PreferitoRepository.class);
    private final NotificaService notificaService = mock(NotificaService.class);
    private final EmailService emailService = mock(EmailService.class);
    private final AutoMapper autoMapper = mock(AutoMapper.class);
    private final AvvisoService service =
            new AvvisoService(avvisoRepository, preferitoRepository, notificaService, emailService, autoMapper);

    private final UUID userId = UUID.randomUUID();
    private final UUID preferitoId = UUID.randomUUID();
    private Preferito preferito;

    @BeforeEach
    void preparaPreferito() {
        Auto auto = new Auto();
        auto.setMarca("Subaru");
        auto.setModello("Outback");
        auto.setPrezzo(new BigDecimal("32400.00"));
        auto.setStatoPubblicazione(StatoPubblicazione.PUBBLICATO);
        preferito = new Preferito(new User("Mario", "Rossi", "user@test.it", "hash", Ruolo.USER), auto);
        when(preferitoRepository.findByIdAndUserId(preferitoId, userId)).thenReturn(Optional.of(preferito));
        when(avvisoRepository.existsByPreferitoId(preferitoId)).thenReturn(false);
    }

    @Test
    void sogliaSopraIlPrezzoRifiutata() {
        BadRequestException e = assertThrows(BadRequestException.class,
                () -> service.crea(userId, preferitoId, new BigDecimal("33000")));
        assertTrue(e.getMessage().contains("inferiore al prezzo attuale"));
        verify(avvisoRepository, never()).saveAndFlush(any());
    }

    @Test
    void sogliaUgualeAlPrezzoRifiutata() {
        assertThrows(BadRequestException.class, () -> service.crea(userId, preferitoId, new BigDecimal("32400.00")));
    }

    @Test
    void sogliaSottoIlPrezzoSalvataSenzaNotificaNeMail() {
        service.crea(userId, preferitoId, new BigDecimal("30000"));
        verify(avvisoRepository).saveAndFlush(any(Avviso.class));
        verifyNoInteractions(notificaService, emailService);
    }

    @Test
    void modificaConSogliaSopraIlPrezzoRifiutata() {
        UUID avvisoId = UUID.randomUUID();
        Avviso avviso = new Avviso(preferito, new BigDecimal("30000"));
        when(avvisoRepository.findByIdAndPreferitoUserId(avvisoId, userId)).thenReturn(Optional.of(avviso));

        assertThrows(BadRequestException.class, () -> service.aggiornaSoglia(userId, avvisoId, new BigDecimal("40000")));
        assertEquals(0, new BigDecimal("30000").compareTo(avviso.getSoglia()), "soglia invariata");
    }
}
