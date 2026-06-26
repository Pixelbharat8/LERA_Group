package com.lera.connect_service.security;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Fail-fast guard for {@code lera.internal.api-key}.
 *
 * <p>The legacy default {@code LERA_INTERNAL_SVC_KEY_2024} used to ship in
 * {@code application.properties} and is in public git history. To prevent a
 * production deploy that "forgets" {@code LERA_INTERNAL_API_KEY} from being
 * silently authenticated by the well-known value, this component refuses to
 * start the service in the {@code prod} profile when the key is blank or
 * equal to the legacy literal. In non-prod profiles we only WARN.
 */
@Component
@Slf4j
public class InternalApiKeyValidator {

    /** Public-history default — must be rejected. */
    static final String LEGACY_WEAK_KEY = "LERA_INTERNAL_SVC_KEY_2024";

    // keep in sync across academy/connect/identity — InternalApiKeyValidatorParityTest asserts identical validate().
    private static final String INTERNAL_KEY_PROD_ERROR =
            "Set LERA_INTERNAL_API_KEY to a strong secret before starting in prod "
                    + "(blank or legacy default LERA_INTERNAL_SVC_KEY_2024 is not allowed).";
    private static final String INTERNAL_KEY_DEV_WARN =
            "lera.internal.api-key is unset or set to the legacy literal — set LERA_INTERNAL_API_KEY before prod.";

    private final String key;
    private final Environment environment;

    public InternalApiKeyValidator(
            @Value("${lera.internal.api-key:}") String key,
            Environment environment) {
        this.key = key == null ? "" : key.trim();
        this.environment = environment;
    }

    @PostConstruct
    void validate() {
        boolean prod = isProdProfile();
        boolean weak = key.isEmpty() || LEGACY_WEAK_KEY.equals(key);
        if (prod && weak) {
            throw new IllegalStateException(INTERNAL_KEY_PROD_ERROR);
        }
        if (weak) {
            log.warn(INTERNAL_KEY_DEV_WARN);
        }
    }

    private boolean isProdProfile() {
        for (String p : environment.getActiveProfiles()) {
            // Treat docker/staging as production-hardened too: deployment runs with
            // SPRING_PROFILES_ACTIVE=docker, and these guards must fire there, not only
            // under the literal "prod" profile (which is never active in deployment).
            if ("prod".equalsIgnoreCase(p) || "docker".equalsIgnoreCase(p) || "staging".equalsIgnoreCase(p)) {
                return true;
            }
        }
        return false;
    }
}
