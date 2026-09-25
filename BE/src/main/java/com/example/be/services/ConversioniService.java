package com.example.be.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

// Conversioni dai dati americani di auto.dev a quelli usati dal salone (euro, km)
@Service
public class ConversioniService {

    private static final BigDecimal KM_PER_MIGLIO = new BigDecimal("1.609344");
    private static final int KM_MASSIMI = 999_999;

    // Tasso fisso USD -> EUR da application.properties: scelta didattica per non dipendere
    // da un'ulteriore API esterna di cambio valuta
    private final BigDecimal tassoUsdEur;

    public ConversioniService(@Value("${app.cambio.usd-eur}") BigDecimal tassoUsdEur) {
        this.tassoUsdEur = tassoUsdEur;
    }

    public BigDecimal usdInEur(BigDecimal usd) {
        if (usd == null) {
            return null;
        }
        return usd.multiply(tassoUsdEur).setScale(2, RoundingMode.HALF_UP);
    }

    // Arrotondato all'intero e limitato a 6 cifre (vincolo del campo km)
    public Integer migliaInKm(Integer miglia) {
        if (miglia == null) {
            return null;
        }
        int km = BigDecimal.valueOf(miglia).multiply(KM_PER_MIGLIO).setScale(0, RoundingMode.HALF_UP).intValue();
        return Math.min(Math.max(km, 0), KM_MASSIMI);
    }
}
