package com.lera.connect_service.security;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Fails CI if {@code InternalApiKeyValidator.validate()} drifts between academy, connect, and identity.
 */
class InternalApiKeyValidatorParityTest {

    @Test
    void validate_method_body_matches_across_services() throws Exception {
        Path moduleRoot = Path.of(System.getProperty("user.dir"));
        String connect = Files.readString(moduleRoot.resolve(
                "src/main/java/com/lera/connect_service/security/InternalApiKeyValidator.java"), StandardCharsets.UTF_8);
        String academy = Files.readString(moduleRoot.resolve(
                "../academy_service/src/main/java/com/lera/academy_service/security/InternalApiKeyValidator.java")
                .normalize(), StandardCharsets.UTF_8);
        String identity = Files.readString(moduleRoot.resolve(
                "../identity_service/src/main/java/com/lera/identity_service/security/InternalApiKeyValidator.java")
                .normalize(), StandardCharsets.UTF_8);

        String c = extractValidateMethod(connect);
        String a = extractValidateMethod(academy);
        String i = extractValidateMethod(identity);

        assertEquals(c, a, "connect vs academy");
        assertEquals(c, i, "connect vs identity");
    }

    private static String extractValidateMethod(String source) {
        int start = source.indexOf("void validate()");
        if (start < 0) {
            throw new IllegalStateException("void validate() not found");
        }
        int open = source.indexOf('{', start);
        int depth = 0;
        for (int idx = open; idx < source.length(); idx++) {
            char ch = source.charAt(idx);
            if (ch == '{') {
                depth++;
            } else if (ch == '}') {
                depth--;
                if (depth == 0) {
                    return source.substring(start, idx + 1);
                }
            }
        }
        throw new IllegalStateException("unterminated validate() body");
    }
}
