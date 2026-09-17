package com.lera.identity_service.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * DataLoader creates the Chairman / CEO / admin accounts on first boot and takes their passwords
 * from lera.seed.*. When those are unset it generates a random one and logs it exactly once —
 * which, for a deployment, means the only record of the Chairman's password is a single line in a
 * container log.
 *
 * application-docker.properties and .env.example both say to set LERA_SEED_* to control this.
 * docker-compose never passed those variables into the container, so setting them did nothing and
 * the random branch always won. This pins the other half of that plumbing: that the environment
 * variable name really does reach the hyphenated property the code reads.
 *
 * Worth testing rather than assuming — hyphenated keys have already caused a binding failure in
 * this codebase once, in the inter-service URL properties.
 */
class SeedPasswordBindingTest {

    /** The property names DataLoader actually reads, and the env vars operators are told to set. */
    private static final Map<String, String> ENV_TO_PROPERTY = Map.of(
            "LERA_SEED_CHAIRMAN_PASSWORD", "lera.seed.chairman-password",
            "LERA_SEED_CEO_PASSWORD", "lera.seed.ceo-password",
            "LERA_SEED_ADMIN_PASSWORD", "lera.seed.admin-password");

    @Test
    void eachSeedEnvVarReachesTheHyphenatedPropertyTheCodeReads() {
        ENV_TO_PROPERTY.forEach((envVar, property) -> {
            StandardEnvironment environment = new StandardEnvironment();
            environment.getPropertySources().replace(
                    StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                    new SystemEnvironmentPropertySource(
                            StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                            Map.of(envVar, "a-real-password")));

            assertEquals("a-real-password", environment.getProperty(property),
                    envVar + " must reach " + property + " — otherwise setting it silently does "
                            + "nothing and DataLoader falls back to a random, logged password");
        });
    }

    @Test
    void anUnsetSeedPasswordResolvesToNothing_soTheRandomFallbackStillApplies() {
        StandardEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().replace(
                StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                new SystemEnvironmentPropertySource(
                        StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, Map.of()));

        assertNull(environment.getProperty("lera.seed.chairman-password"));
    }
}
