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

    /**
     * Auto-provisioned accounts get a random password that nobody is shown.
     *
     * This used to be the constant "Lera@123", committed to this repository — so anyone with the
     * source could sign in as any teacher or parent the importer had created. The
     * passwordChangeRequired flag did not close that: it is honoured by the frontend router only,
     * and POST /api/auth/login issues a working token regardless.
     *
     * Nothing needs to know this value. Onboarding goes through the one-time link from
     * /api/auth/set-password-link (or send-set-password-email), which is what that endpoint was
     * built for.
     */
    private static final String PROVISION_ALPHABET =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final java.security.SecureRandom PROVISION_RANDOM = new java.security.SecureRandom();

    private static String randomProvisionPassword() {
        StringBuilder p = new StringBuilder(25);
        for (int i = 0; i < 24; i++) {
            p.append(PROVISION_ALPHABET.charAt(PROVISION_RANDOM.nextInt(PROVISION_ALPHABET.length())));
        }
        return p.append('!').toString();
    }

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
    public Optional<UUID> provisionUser(String email, String fullname, String phone, String roleName) {
        if (email == null || email.isBlank()) return Optional.empty();
        try {
            Map<String, String> body = new HashMap<>();
            body.put("email", email.trim());
            body.put("fullname", fullname == null ? "" : fullname.trim());
            if (phone != null && !phone.isBlank()) body.put("phone", phone.trim());
            body.put("roleName", roleName);
            body.put("password", randomProvisionPassword());

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
