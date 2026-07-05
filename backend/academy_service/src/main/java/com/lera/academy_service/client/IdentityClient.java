package com.lera.academy_service.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Calls identity_service to auto-create login accounts for bulk-imported people (parents/teachers).
 * Uses the shared internal API key (server-to-server), same trust model as {@code /api/auth/register}.
 */
@Slf4j
@Component
public class IdentityClient {

    /** Default password for auto-provisioned import accounts. Users change it after first login. */
    public static final String DEFAULT_IMPORT_PASSWORD = "Lera@123";

    private final RestTemplate restTemplate;

    @Value("${identity.service.url:http://localhost:8081}")
    private String identityUrl;

    @Value("${lera.internal.api-key:}")
    private String internalApiKey;

    public IdentityClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Create-or-get a login account by email with the given role + default password.
     * Returns the (existing or new) userId, or empty on failure — a failure must not abort the
     * whole import batch, so callers just skip linking that one record.
     */
    public Optional<UUID> provisionUser(String email, String fullname, String roleName) {
        if (email == null || email.isBlank()) return Optional.empty();
        try {
            Map<String, String> body = new HashMap<>();
            body.put("email", email.trim());
            body.put("fullname", fullname == null ? "" : fullname.trim());
            body.put("roleName", roleName);
            body.put("password", DEFAULT_IMPORT_PASSWORD);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (internalApiKey != null && !internalApiKey.isBlank()) {
                headers.set("X-Internal-Key", internalApiKey);
            }
            HttpEntity<Map<String, String>> req = new HttpEntity<>(body, headers);

            ResponseEntity<Map> resp = restTemplate.postForEntity(
                    identityUrl + "/api/auth/provision-user", req, Map.class);
            Map<?, ?> b = resp.getBody();
            if (b != null && Boolean.TRUE.equals(b.get("success")) && b.get("userId") != null) {
                return Optional.of(UUID.fromString(b.get("userId").toString()));
            }
            log.warn("provisionUser failed for {} ({}): {}", email, roleName, b == null ? "no body" : b.get("error"));
        } catch (Exception e) {
            log.warn("provisionUser error for {} ({}): {}", email, roleName, e.getMessage());
        }
        return Optional.empty();
    }
}
