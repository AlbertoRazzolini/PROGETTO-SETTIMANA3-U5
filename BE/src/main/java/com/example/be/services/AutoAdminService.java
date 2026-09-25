package com.example.be.services;

import com.example.be.dto.PaginaDto;
import com.example.be.dto.auto.AutoAdminDto;
import com.example.be.dto.auto.AutoUpdateDto;
import com.example.be.dto.autodev.AnteprimaAnnuncioDto;
import com.example.be.entities.Auto;
import com.example.be.enums.StatoPubblicazione;
import com.example.be.events.PrezzoAutoAggiornatoEvent;
import com.example.be.exceptions.BadRequestException;
import com.example.be.exceptions.ConflictException;
import com.example.be.exceptions.NotFoundException;
import com.example.be.repositories.AutoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AutoAdminService {

    private final AutoRepository autoRepository;
    private final AutoDevService autoDevService;
    private final AutoMapper autoMapper;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Importa un annuncio da auto.dev e lo salva come BOZZA, con i dati gia' convertiti
     * (euro, km, italiano: vedi AutoDevService). L'admin poi lo rivede e lo pubblica.
     */
    @Transactional
    public AutoAdminDto importa(String listingId) {
        String id = listingId.trim().toUpperCase(Locale.ROOT);
        // Controllo PRIMA della chiamata ad auto.dev: non si sprecano crediti per un doppione
        if (autoRepository.existsByListingId(id)) {
            throw new ConflictException("Annuncio gia' importato");
        }
        AnteprimaAnnuncioDto a = autoDevService.anteprima(id);

        Auto auto = new Auto();
        auto.setListingId(id);
        auto.setVin(a.vin());
        auto.setMarca(a.marca());
        auto.setModello(a.modello());
        auto.setAnno(a.anno());
        auto.setCarburante(a.carburante());
        auto.setDescrizione(a.descrizione());
        auto.setSchedaTecnica(a.schedaTecnica() != null ? a.schedaTecnica().toString() : null);
        auto.setImmagini(new ArrayList<>(a.foto()));
        auto.setKm(a.km());
        auto.setPrezzo(a.prezzoEur());
        auto.setStato(a.statoSuggerito());
        auto.setStatoPubblicazione(StatoPubblicazione.BOZZA);

        autoRepository.saveAndFlush(auto);
        autoDevService.dimenticaAnteprima(id);
        log.info("Importato annuncio {} come bozza (auto id {})", id, auto.getId());
        return autoMapper.toAdminDto(auto);
    }

    @Transactional(readOnly = true)
    public PaginaDto<AutoAdminDto> elenca(StatoPubblicazione stato, int pagina, int dimensione, String sort) {
        PageRequest pageable = PageRequest.of(pagina, dimensione, OrdinamentoAuto.da(sort));
        Page<Auto> page = stato == null
                ? autoRepository.findAll(pageable)
                : autoRepository.findByStatoPubblicazione(stato, pageable);
        return PaginaDto.da(page, autoMapper::toAdminDto);
    }

    @Transactional(readOnly = true)
    public AutoAdminDto dettaglio(UUID id) {
        return autoMapper.toAdminDto(trova(id));
    }

    // Solo dati descrittivi: il prezzo passa sempre da aggiornaPrezzo (unico punto che controlla gli avvisi)
    @Transactional
    public AutoAdminDto aggiorna(UUID id, AutoUpdateDto dto) {
        Auto auto = trova(id);
        auto.setKm(dto.km());
        auto.setStato(dto.stato());
        auto.setDescrizione(dto.descrizione().trim());
        return salvaERispondi(auto);
    }

    @Transactional
    public AutoAdminDto aggiornaPrezzo(UUID id, BigDecimal nuovoPrezzo) {
        Auto auto = trova(id);
        BigDecimal prezzoPrecedente = auto.getPrezzo();
        auto.setPrezzo(nuovoPrezzo);
        segnalaSeCambiaPrezzo(auto, prezzoPrecedente);
        return salvaERispondi(auto);
    }

    @Transactional
    public AutoAdminDto pubblica(UUID id) {
        Auto auto = trova(id);
        // Un annuncio visibile agli utenti deve essere completo
        if (auto.getPrezzo() == null || auto.getKm() == null || auto.getStato() == null
                || auto.getDescrizione() == null || auto.getDescrizione().isBlank()) {
            throw new BadRequestException("Per pubblicare servono prezzo, chilometraggio, stato e descrizione");
        }
        if (auto.getStatoPubblicazione() != StatoPubblicazione.PUBBLICATO) {
            auto.setStatoPubblicazione(StatoPubblicazione.PUBBLICATO);
            // Alla (ri)pubblicazione il prezzo puo' essere cambiato mentre era in bozza: si ricontrollano le soglie
            eventPublisher.publishEvent(new PrezzoAutoAggiornatoEvent(auto.getId()));
            log.info("Pubblicato annuncio auto id {}", id);
        }
        return salvaERispondi(auto);
    }

    @Transactional
    public AutoAdminDto mettiInBozza(UUID id) {
        Auto auto = trova(id);
        auto.setStatoPubblicazione(StatoPubblicazione.BOZZA);
        return salvaERispondi(auto);
    }

    // Flush prima di rispondere: cosi' @UpdateTimestamp aggiorna updatedAt gia' nella risposta
    private AutoAdminDto salvaERispondi(Auto auto) {
        autoRepository.saveAndFlush(auto);
        return autoMapper.toAdminDto(auto);
    }

    private Auto trova(UUID id) {
        return autoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Annuncio non trovato"));
    }

    // Le soglie degli utenti si controllano solo per annunci visibili e solo se il prezzo e' davvero cambiato
    private void segnalaSeCambiaPrezzo(Auto auto, BigDecimal prezzoPrecedente) {
        boolean cambiato = prezzoPrecedente == null || prezzoPrecedente.compareTo(auto.getPrezzo()) != 0;
        if (cambiato && auto.getStatoPubblicazione() == StatoPubblicazione.PUBBLICATO) {
            eventPublisher.publishEvent(new PrezzoAutoAggiornatoEvent(auto.getId()));
        }
    }
}
