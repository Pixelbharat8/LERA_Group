package com.lera.academy_service.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Locks the fail-fast contract for {@code lera.internal.api-key}: prod cannot boot with a blank
 * or legacy default value, while non-prod profiles only WARN.
 */
class InternalApiKeyValidatorTest {

    @Test
    void prodProfileWithBlankKeyFailsFast() {
        MockEnvironment env = new MockEnvironment().withProperty("a", "b");
        env.setActiveProfiles("prod");
        InternalApiKeyValidator v = new InternalApiKeyValidator("", env);
        assertThatThrownBy(v::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("LERA_INTERNAL_API_KEY");
    }

    @Test
    void prodProfileWithLegacyLiteralFailsFast() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        InternalApiKeyValidator v = new InternalApiKeyValidator(
                InternalApiKeyValidator.LEGACY_WEAK_KEY, env);
        assertThatThrownBy(v::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("LERA_INTERNAL_SVC_KEY_2024");
    }

    @Test
    void prodProfileWithStrongKeyStarts() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        InternalApiKeyValidator v = new InternalApiKeyValidator("sufficiently-random-1234", env);
        v.validate();
    }

    @Test
    void devProfileWithBlankKeyOnlyWarns() {
        MockEnvironment env = new MockEnvironment();
        // No active profile = dev/local. Should not throw.
        InternalApiKeyValidator v = new InternalApiKeyValidator("", env);
        v.validate();
        assertThat(env.getActiveProfiles()).isEmpty();
    }

    @Test
    void devProfileWithLegacyLiteralOnlyWarns() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        InternalApiKeyValidator v = new InternalApiKeyValidator(
                InternalApiKeyValidator.LEGACY_WEAK_KEY, env);
        v.validate();
    }
}
