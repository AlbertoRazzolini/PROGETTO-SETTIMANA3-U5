package com.example.be.config;

import org.apache.catalina.Valve;
import org.apache.catalina.core.StandardHost;
import org.apache.catalina.valves.ErrorReportValve;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.stereotype.Component;

/**
 * Disattiva il contenuto della pagina d'errore di default di Tomcat (ErrorReportValve).
 *
 * Per gli errori a livello di connettore (es. header o URL troppo grandi), che avvengono PRIMA che la
 * richiesta raggiunga l'applicazione, Tomcat serve una pagina HTML con lo stack trace Java e la versione
 * del server ("Apache Tomcat/x.y.z"): informazioni utili a un attaccante e da non esporre.
 * Con showReport=false e showServerInfo=false il corpo di quegli errori resta vuoto (solo lo status).
 * Gli errori applicativi continuano a passare da GlobalExceptionHandler con il JSON uniforme.
 */
@Component
public class TomcatErrorReportCustomizer implements WebServerFactoryCustomizer<TomcatServletWebServerFactory> {

    @Override
    public void customize(TomcatServletWebServerFactory factory) {
        factory.addContextCustomizers(context -> {
            if (context.getParent() instanceof StandardHost host) {
                boolean configurato = false;
                for (Valve valve : host.getPipeline().getValves()) {
                    if (valve instanceof ErrorReportValve erv) {
                        erv.setShowReport(false);
                        erv.setShowServerInfo(false);
                        configurato = true;
                    }
                }
                // Se Tomcat non l'ha ancora aggiunta, la aggiungiamo noi gia' silenziata
                if (!configurato) {
                    ErrorReportValve erv = new ErrorReportValve();
                    erv.setShowReport(false);
                    erv.setShowServerInfo(false);
                    host.getPipeline().addValve(erv);
                }
            }
        });
    }
}
