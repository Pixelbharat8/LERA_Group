package com.lera.connect_service.service.push;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
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
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * FCM HTTP v1 client. Uses a service-account JSON key to mint OAuth access
 * tokens, then POSTs to {@code projects/{projectId}/messages:send}.
 *
 * <p>Configuration:
 * <ul>
 *   <li>{@code lera.push.fcm.project-id} — Firebase project id</li>
 *   <li>{@code lera.push.fcm.service-account-path} — path to the JSON file</li>
 *   <li>{@code lera.push.fcm.service-account-json} — alt: raw JSON content</li>
 * </ul>
 *
 * <p>Access tokens are cached until ~5 minutes before their {@code expires_in}.
 */
@Component
@Slf4j
public class FcmClient {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

    @Value("${lera.push.fcm.project-id:}")            private String projectId;
    @Value("${lera.push.fcm.service-account-path:}")  private String serviceAccountPath;
    @Value("${lera.push.fcm.service-account-json:}")  private String serviceAccountJson;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final AtomicReference<CachedToken> cached = new AtomicReference<>();
    private volatile JsonNode serviceAccount;

    @PostConstruct
    void parseServiceAccount() {
        String src = (serviceAccountJson != null && !serviceAccountJson.isBlank())
                ? serviceAccountJson
                : null;
        try {
            if (src == null && serviceAccountPath != null && !serviceAccountPath.isBlank()) {
                src = Files.readString(Path.of(serviceAccountPath), StandardCharsets.UTF_8);
            }
            if (src == null) return;
            serviceAccount = MAPPER.readTree(src);
        } catch (Exception e) {
            log.warn("fcm: cannot parse service-account JSON: {}", e.getMessage());
        }
    }

    public boolean isConfigured() {
        return projectId != null && !projectId.isBlank()
                && serviceAccount != null
                && serviceAccount.hasNonNull("client_email")
                && serviceAccount.hasNonNull("private_key");
    }

    /** Returns the delivery outcome. Never throws. */
    public PushResult send(String deviceToken, String title, String body) {
        return send(deviceToken, title, body, null);
    }

    /**
     * Optional {@code data} is merged into the FCM {@code message.data} map (values must be strings).
     */
    public PushResult send(String deviceToken, String title, String body, Map<String, String> data) {
        if (!isConfigured()) {
            log.debug("fcm: not configured, skipping send");
            return PushResult.RETRY;
        }
        if (deviceToken == null || deviceToken.isBlank()) return PushResult.DEAD;
        try {
            String accessToken = accessToken();

            Map<String, Object> notification = new HashMap<>();
            notification.put("title", title == null ? "" : title);
            notification.put("body", body == null ? "" : body);
            Map<String, Object> message = new HashMap<>();
            message.put("token", deviceToken);
            message.put("notification", notification);
            if (data != null && !data.isEmpty()) {
                Map<String, String> stringData = new HashMap<>();
                for (var e : data.entrySet()) {
                    if (e.getKey() == null || e.getKey().isBlank()) {
                        continue;
                    }
                    stringData.put(e.getKey(), e.getValue() == null ? "" : e.getValue());
                }
                if (!stringData.isEmpty()) {
                    message.put("data", stringData);
                }
            }
            String payload = MAPPER.writeValueAsString(Map.of("message", message));

            URI uri = URI.create("https://fcm.googleapis.com/v1/projects/" + projectId + "/messages:send");
            HttpRequest req = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(10))
                    .header("authorization", "Bearer " + accessToken)
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            int status = resp.statusCode();
            if (status / 100 == 2) return PushResult.DELIVERED;

            // Per the FCM v1 error spec:
            // - 404 NOT_FOUND / errorCode UNREGISTERED → app uninstalled
            // - 400 INVALID_ARGUMENT with errorCode INVALID_REGISTRATION → malformed
            // - 403 SENDER_ID_MISMATCH → wrong project, dead from our PoV
            // Everything else (429, 5xx) is transient.
            String errorCode = parseFcmErrorCode(resp.body());
            if (status == 404
                    || "UNREGISTERED".equals(errorCode)
                    || "INVALID_REGISTRATION".equals(errorCode)
                    || "INVALID_ARGUMENT".equals(errorCode)
                    || "SENDER_ID_MISMATCH".equals(errorCode)) {
                log.info("fcm: token dead status={} errorCode={}", status, errorCode);
                return PushResult.DEAD;
            }
            log.warn("fcm: send failed status={} errorCode={}", status, errorCode);
            return PushResult.RETRY;
        } catch (Exception e) {
            log.warn("fcm: send exception: {}", e.getMessage());
            return PushResult.RETRY;
        }
    }

    private static String parseFcmErrorCode(String body) {
        if (body == null || body.isBlank()) return null;
        try {
            // FCM's error envelope nests details[].errorCode plus a top-level
            // error.status. We try both so we handle the common shapes.
            var root = MAPPER.readTree(body);
            var error = root.path("error");
            String status = error.path("status").asText(null);
            if (status != null && !status.isBlank()) return status;
            var details = error.path("details");
            if (details.isArray()) {
                for (var d : details) {
                    String code = d.path("errorCode").asText(null);
                    if (code != null && !code.isBlank()) return code;
                }
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    private String accessToken() throws Exception {
        CachedToken c = cached.get();
        if (c != null && Instant.now().isBefore(c.expires.minus(Duration.ofMinutes(5)))) {
            return c.token;
        }
        // Mint an RS256 JWT and exchange via the urn:ietf:params:oauth:grant-type:jwt-bearer flow.
        String clientEmail = serviceAccount.get("client_email").asText();
        PrivateKey privateKey = loadPrivateKey(serviceAccount.get("private_key").asText());

        Instant now = Instant.now();
        String jwt = Jwts.builder()
                .setIssuer(clientEmail)
                .setAudience(OAUTH_TOKEN_URL)
                .claim("scope", FCM_SCOPE)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(Duration.ofHours(1))))
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();

        String form = "grant_type=" + URLEncoder.encode("urn:ietf:params:oauth:grant-type:jwt-bearer", StandardCharsets.UTF_8)
                + "&assertion=" + URLEncoder.encode(jwt, StandardCharsets.UTF_8);

        HttpRequest req = HttpRequest.newBuilder(URI.create(OAUTH_TOKEN_URL))
                .timeout(Duration.ofSeconds(10))
                .header("content-type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() / 100 != 2) {
            throw new IllegalStateException("oauth exchange failed: " + resp.statusCode() + " " + resp.body());
        }
        JsonNode body = MAPPER.readTree(resp.body());
        String token = body.path("access_token").asText();
        long expiresIn = body.path("expires_in").asLong(3600L);
        cached.set(new CachedToken(token, Instant.now().plusSeconds(expiresIn)));
        return token;
    }

    private static PrivateKey loadPrivateKey(String pem) throws Exception {
        String b64 = pem.replace("-----BEGIN PRIVATE KEY-----", "")
                        .replace("-----END PRIVATE KEY-----", "")
                        .replaceAll("\\s+", "");
        byte[] der = Base64.getDecoder().decode(b64);
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    private record CachedToken(String token, Instant expires) {}
}
