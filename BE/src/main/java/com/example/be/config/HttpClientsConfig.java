package com.example.be.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class HttpClientsConfig {

    // Client per auto.dev: base URL e API key (header Authorization: Bearer) impostati una volta sola.
    // La chiave arriva dalla variabile d'ambiente AUTODEV_API_KEY e non compare mai nei log.
    @Bean
    public RestClient autoDevRestClient(RestClient.Builder builder,
                                        @Value("${app.autodev.base-url}") String baseUrl,
                                        @Value("${app.autodev.api-key}") String apiKey) {
        return builder.clone()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory(Duration.ofSeconds(15)))
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }

    @Bean
    public RestClient myMemoryRestClient(RestClient.Builder builder,
                                         @Value("${app.traduzione.base-url}") String baseUrl) {
        return builder.clone()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory(Duration.ofSeconds(10)))
                .build();
    }

    // Executor per le chiamate asincrone ad auto.dev: virtual thread (Java 21+),
    // leggeri e adatti a operazioni che passano quasi tutto il tempo in attesa di rete
    @Bean(destroyMethod = "close")
    public ExecutorService autoDevExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }

    // Timeout espliciti: un servizio esterno lento non deve bloccare le richieste all'infinito
    private JdkClientHttpRequestFactory requestFactory(Duration readTimeout) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(readTimeout);
        return factory;
    }
}
