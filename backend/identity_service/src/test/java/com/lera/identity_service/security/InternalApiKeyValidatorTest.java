package com.lera.identity_service.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InternalApiKeyValidatorTest {

    @Test
    void prodProfileWithBlankKeyFailsFast() {
        MockEnvironment env = new MockEnvironment();
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
        new InternalApiKeyValidator("sufficiently-random-1234", env).validate();
    }

    @Test
    void devProfileWithBlankKeyOnlyWarns() {
        MockEnvironment env = new MockEnvironment();
        new InternalApiKeyValidator("", env).validate();
    }
}
