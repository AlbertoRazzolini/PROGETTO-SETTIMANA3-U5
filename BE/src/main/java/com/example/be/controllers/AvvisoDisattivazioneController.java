package com.example.be.controllers;

import com.example.be.services.AvvisoService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

import java.util.regex.Pattern;

// Link "disattiva avviso" della mail: si apre nel browser, quindi risponde con una piccola pagina HTML
// (template Thymeleaf) invece che con JSON. Pubblico: chi ha il token puo' disattivare quell'avviso.
@Controller
@RequiredArgsConstructor
public class AvvisoDisattivazioneController {

    // Formato del token generato dal server (Base64 URL-safe, 43 caratteri)
    private static final Pattern FORMATO_TOKEN = Pattern.compile("^[A-Za-z0-9_-]{43}$");

    private final AvvisoService avvisoService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    // GET /api/avvisi/disattiva?token=... -> 200 se disattivato, 404 se il token non e' valido o gia' usato
    @GetMapping("/api/avvisi/disattiva")
    public ModelAndView disattiva(@RequestParam(required = false) String token) {
        boolean ok = token != null && FORMATO_TOKEN.matcher(token).matches() && avvisoService.disattivaConToken(token);
        ModelAndView mav = new ModelAndView("avviso-disattivato");
        mav.addObject("ok", ok);
        mav.addObject("frontendUrl", frontendUrl);
        mav.setStatus(ok ? HttpStatus.OK : HttpStatus.NOT_FOUND);
        return mav;
    }
}
