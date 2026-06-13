package com.lera.connect_service.service.push;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Minimal APNs HTTP/2 client using token-based authentication (.p8 key).
 *
 * <p>Configuration (any may be empty — when key material is missing the
 * client is a no-op and {@link #send(String, String, String)} just logs):
 * <ul>
 *   <li>{@code lera.push.apns.team-id} — Apple Developer team id</li>
 *   <li>{@code lera.push.apns.key-id} — the 10-char .p8 key id</li>
 *   <li>{@code lera.push.apns.bundle-id} — iOS app bundle id</li>
 *   <li>{@code lera.push.apns.key-path} — filesystem path to AuthKey_*.p8</li>
 *   <li>{@code lera.push.apns.key-pem} — alternative: raw PEM contents</li>
 *   <li>{@code lera.push.apns.sandbox} — when {@code true}, talk to
 *       {@code api.sandbox.push.apple.com} instead of production</li>
 * </ul>
 *
 * <p>The provider JWT is cached for ~50 minutes (Apple rotates them every
 * hour; we refresh slightly early to avoid the boundary).
 */
@Component
@Slf4j
public class ApnsClient {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Duration TOKEN_TTL = Duration.ofMinutes(50);

    @Value("${lera.push.apns.team-id:}")     private String teamId;
    @Value("${lera.push.apns.key-id:}")      private String keyId;
    @Value("${lera.push.apns.bundle-id:}")   private String bundleId;
    @Value("${lera.push.apns.key-path:}")    private String keyPath;
    @Value("${lera.push.apns.key-pem:}")     private String keyPem;
    @Value("${lera.push.apns.sandbox:true}") private boolean sandbox;

    private final HttpClient http = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_2)
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final AtomicReference<CachedJwt> cached = new AtomicReference<>();

    public boolean isConfigured() {
        return teamId != null && !teamId.isBlank()
                && keyId != null && !keyId.isBlank()
                && bundleId != null && !bundleId.isBlank()
                && (
                    (keyPath != null && !keyPath.isBlank())
                    || (keyPem != null && !keyPem.isBlank())
                );
    }

    /** Returns the delivery outcome. Never throws. */
    public PushResult send(String deviceToken, String title, String body) {
        return send(deviceToken, title, body, null);
    }

    /**
     * Custom string fields are placed next to {@code aps} (Apple-recommended pattern for app-specific data).
     */
    public PushResult send(String deviceToken, String title, String body, Map<String, String> data) {
        if (!isConfigured()) {
            log.debug("apns: not configured, skipping send");
            return PushResult.RETRY;
        }
        if (deviceToken == null || deviceToken.isBlank()) return PushResult.DEAD;
        try {
            String jwt = providerJwt();
            String host = sandbox ? "api.sandbox.push.apple.com" : "api.push.apple.com";
            URI uri = URI.create("https://" + host + "/3/device/" + deviceToken);

            Map<String, Object> aps = new HashMap<>();
            aps.put("alert", Map.of("title", title == null ? "" : title, "body", body == null ? "" : body));
            aps.put("sound", "default");
            Map<String, Object> root = new LinkedHashMap<>();
            root.put("aps", aps);
            if (data != null) {
                for (var e : data.entrySet()) {
                    if (e.getKey() == null || e.getKey().isBlank()) {
                        continue;
                    }
                    root.put(e.getKey(), e.getValue() == null ? "" : e.getValue());
                }
            }
            String payload = MAPPER.writeValueAsString(root);

            HttpRequest req = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(10))
                    .header("authorization", "bearer " + jwt)
                    .header("apns-topic", bundleId)
                    .header("apns-push-type", "alert")
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            int status = resp.statusCode();
            if (status / 100 == 2) return PushResult.DELIVERED;

            // Apple flags dead tokens with 410 Gone (BadDeviceToken,
            // Unregistered) and certain 400s (BadDeviceToken when the token
            // is malformed). Delete those so we don't keep retrying. Anything
            // else is transient — keep the token and retry on the next push.
            String reason = parseApnsReason(resp.body());
            if (status == 410 || "BadDeviceToken".equals(reason) || "Unregistered".equals(reason)
                    || "DeviceTokenNotForTopic".equals(reason)) {
                log.info("apns: token dead status={} reason={}", status, reason);
                return PushResult.DEAD;
            }
            log.warn("apns: send failed status={} reason={}", status, reason);
            return PushResult.RETRY;
        } catch (Exception e) {
            log.warn("apns: send exception: {}", e.getMessage());
            return PushResult.RETRY;
        }
    }

    private static String parseApnsReason(String body) {
        if (body == null || body.isBlank()) return null;
        try {
            return MAPPER.readTree(body).path("reason").asText(null);
        } catch (Exception e) {
            return null;
        }
    }

    /** ES256 JWT signed by the .p8 key, cached for {@link #TOKEN_TTL}. */
    private String providerJwt() throws Exception {
        CachedJwt c = cached.get();
        if (c != null && Instant.now().isBefore(c.expires.minus(Duration.ofMinutes(2)))) {
            return c.token;
        }
        PrivateKey privateKey = loadPrivateKey();
        Instant now = Instant.now();
        String token = Jwts.builder()
                .setHeaderParam("kid", keyId)
                .setHeaderParam("alg", "ES256")
                .setIssuer(teamId)
                .setIssuedAt(Date.from(now))
                .signWith(privateKey, SignatureAlgorithm.ES256)
                .compact();
        cached.set(new CachedJwt(token, now.plus(TOKEN_TTL)));
        return token;
    }

    private PrivateKey loadPrivateKey() throws Exception {
        String pem = (keyPem != null && !keyPem.isBlank())
                ? keyPem
                : Files.readString(Path.of(keyPath), StandardCharsets.UTF_8);
        // Strip PEM headers and whitespace.
        String b64 = pem.replace("-----BEGIN PRIVATE KEY-----", "")
                        .replace("-----END PRIVATE KEY-----", "")
                        .replaceAll("\\s+", "");
        byte[] der = Base64.getDecoder().decode(b64);
        // Apple .p8 files are EC P-256 PKCS#8 — the algorithm OID inside the
        // DER is enough for KeyFactory("EC") to recognise it.
        return KeyFactory.getInstance("EC").generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    private record CachedJwt(String token, Instant expires) {}
}
