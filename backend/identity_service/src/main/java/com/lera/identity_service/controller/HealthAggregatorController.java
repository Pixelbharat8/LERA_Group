package com.lera.identity_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Lightweight health aggregator. Pings the {@code /actuator/health} endpoint of
 * each upstream microservice in parallel and returns a single JSON document.
 *
 * <p>Useful for an ops dashboard that wants a one-stop status view without
 * having to poll every service individually. Each probe has a 1.5s timeout
 * so a single dead service can't drag the response past ~2s.
 *
 * <p>Defaults assume the no-Docker local layout (all services on
 * {@code 127.0.0.1}). In Docker or another deployment topology, override per
 * service via the {@code LERA_HEALTH_<NAME>_URL} environment variable, e.g.
 * {@code LERA_HEALTH_IDENTITY_URL=http://identity_service:8081/actuator/health}.
 */
@RestController
@RequestMapping("/api/health")
@PreAuthorize("permitAll()")
public class HealthAggregatorController {

    private static final List<Service> SERVICES = List.of(
            svc("identity",     8081),
            svc("academy",      8082),
            svc("payment",      8083),
            svc("payroll",      8084),
            svc("attendance",   8085),
            svc("connect",      8086),
            svc("ai_gateway",   8087),
            svc("rule_engine",  8088),
            svc("social_media", 8089)
    );

    private static Service svc(String name, int defaultPort) {
        String envKey = "LERA_HEALTH_" + name.toUpperCase() + "_URL";
        String url = System.getenv(envKey);
        if (url == null || url.isBlank()) {
            url = "http://127.0.0.1:" + defaultPort + "/actuator/health";
        }
        return new Service(name, url);
    }

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(800))
            .build();

    @GetMapping
    public ResponseEntity<Map<String, Object>> aggregate() {
        List<CompletableFuture<Map.Entry<String, String>>> futures = SERVICES.stream()
                .map(this::probe)
                .collect(Collectors.toList());

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                .orTimeout(2, TimeUnit.SECONDS)
                .exceptionally(t -> null)
                .join();

        Map<String, Object> services = new LinkedHashMap<>();
        boolean allUp = true;
        for (CompletableFuture<Map.Entry<String, String>> f : futures) {
            Map.Entry<String, String> entry = f.getNow(Map.entry("?", "TIMEOUT"));
            services.put(entry.getKey(), entry.getValue());
            if (!"UP".equalsIgnoreCase(entry.getValue())) allUp = false;
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status",   allUp ? "UP" : "DEGRADED");
        body.put("services", services);
        body.put("ts",       System.currentTimeMillis());
        return ResponseEntity.ok(body);
    }

    private CompletableFuture<Map.Entry<String, String>> probe(Service svc) {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(svc.url))
                .timeout(Duration.ofMillis(1500))
                .GET()
                .build();
        return client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                .thenApply(r -> Map.entry(svc.name, r.statusCode() == 200 ? "UP" : "DOWN"))
                .exceptionally(ex -> Map.entry(svc.name, "DOWN"));
    }

    private record Service(String name, String url) {}
}
