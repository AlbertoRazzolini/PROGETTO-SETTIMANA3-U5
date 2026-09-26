package com.example.be.exceptions;

import com.example.be.dto.ErrorResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.util.http.InvalidParameterException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import tools.jackson.databind.exc.MismatchedInputException;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ---------- 400 ----------

    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponseDto handleBadRequest(BadRequestException ex) {
        return errore(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // @Valid sul body: restituisce l'elenco dei campi non validi
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponseDto handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> campi = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            campi.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }
        return new ErrorResponseDto(HttpStatus.BAD_REQUEST.value(), HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Dati non validi", campi);
    }

    // Validazione di @RequestParam / @PathVariable (es. @Size, @Min)
    @ExceptionHandler(HandlerMethodValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponseDto handleMethodValidation(HandlerMethodValidationException ex) {
        Map<String, String> campi = new LinkedHashMap<>();
        ex.getParameterValidationResults().forEach(r -> {
            String nome = r.getMethodParameter().getParameterName();
            r.getResolvableErrors().stream().findFirst()
                    .ifPresent(e -> campi.putIfAbsent(nome != null ? nome : "parametro", e.getDefaultMessage()));
        });
        return new ErrorResponseDto(HttpStatus.BAD_REQUEST.value(), HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Parametri non validi", campi);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponseDto handleBodyIllegibile(HttpMessageNotReadableException ex) {
        // Valore di tipo sbagliato in un campo (es. "stato":"ROTTO" o "km":"abc"): si indica quale campo
        if (ex.getCause() instanceof MismatchedInputException mie && !mie.getPath().isEmpty()) {
            String campo = mie.getPath().getLast().getPropertyName();
            if (campo != null) {
                return new ErrorResponseDto(HttpStatus.BAD_REQUEST.value(), HttpStatus.BAD_REQUEST.getReasonPhrase(),
                        "Dati non validi", Map.of(campo, "Valore non valido"));
            }
        }
        return errore(HttpStatus.BAD_REQUEST, "Corpo della richiesta mancante o non valido");
    }

    // Es. UUID malformato nel path o enum inesistente nei parametri
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponseDto handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return errore(HttpStatus.BAD_REQUEST, "Valore non valido per il parametro '" + ex.getName() + "'");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponseDto handleParametroMancante(MissingServletRequestParameterException ex) {
        return errore(HttpStatus.BAD_REQUEST, "Parametro obbligatorio mancante: '" + ex.getParameterName() + "'");
    }

    // Parametro con percent-encoding non valido (es. ?q=%FF): richiesta malformata del client, non errore del
    // server. Senza questo handler finirebbe nel gestore generico come 500. Il valore corrotto non si registra.
    @ExceptionHandler(InvalidParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponseDto handleParametroNonDecodificabile(InvalidParameterException ex) {
        return errore(HttpStatus.BAD_REQUEST, "Parametro della richiesta non valido");
    }

    // ---------- 401 / 403 ----------

    @ExceptionHandler(UnauthorizedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorResponseDto handleUnauthorized(UnauthorizedException ex) {
        return errore(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    // Lanciata da @PreAuthorize quando l'utente e' autenticato ma non ha il ruolo richiesto
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponseDto handleAccessDenied(AccessDeniedException ex) {
        return errore(HttpStatus.FORBIDDEN, "Non hai i permessi per questa operazione");
    }

    // ---------- 404 / 405 / 409 ----------

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponseDto handleNotFound(NotFoundException ex) {
        return errore(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponseDto handleNoResource(NoResourceFoundException ex) {
        return errore(HttpStatus.NOT_FOUND, "Risorsa non trovata");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public ErrorResponseDto handleMetodoNonSupportato(HttpRequestMethodNotSupportedException ex) {
        return errore(HttpStatus.METHOD_NOT_ALLOWED, "Metodo " + ex.getMethod() + " non supportato");
    }

    @ExceptionHandler(ConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponseDto handleConflict(ConflictException ex) {
        return errore(HttpStatus.CONFLICT, ex.getMessage());
    }

    // Violazione di un vincolo del DB (es. unique) scappata ai controlli applicativi:
    // messaggio generico, senza esporre dettagli dello schema
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponseDto handleDataIntegrity(DataIntegrityViolationException ex) {
        return errore(HttpStatus.CONFLICT, "Operazione in conflitto con dati esistenti");
    }

    // ---------- 502 / 500 ----------

    @ExceptionHandler(ExternalApiException.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public ErrorResponseDto handleExternalApi(ExternalApiException ex) {
        log.warn("Errore servizio esterno: {}", ex.getMessage());
        return errore(HttpStatus.BAD_GATEWAY, ex.getMessage());
    }

    // Tutto il resto: log completo lato server, messaggio generico al client (niente stacktrace)
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponseDto handleGenerico(Exception ex) {
        log.error("Errore non gestito", ex);
        return errore(HttpStatus.INTERNAL_SERVER_ERROR, "Errore interno del server");
    }

    private ErrorResponseDto errore(HttpStatus status, String messaggio) {
        return new ErrorResponseDto(status.value(), status.getReasonPhrase(), messaggio);
    }
}
