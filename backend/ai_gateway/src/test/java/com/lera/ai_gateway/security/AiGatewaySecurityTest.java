package com.lera.ai_gateway.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AiGatewaySecurityTest {

    @Test
    void effectiveUserId_otherUser_forbidden() {
        AuthUser teacher = AuthUser.builder()
                .userId(UUID.randomUUID())
                .roleName("STUDENT")
                .build();
        UUID other = UUID.randomUUID();
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> AiGatewaySecurity.effectiveUserId(teacher, other));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void assertOrgWide_staff_forbidden() {
        AuthUser teacher = AuthUser.builder()
                .userId(UUID.randomUUID())
                .roleName("TEACHER")
                .build();
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> AiGatewaySecurity.assertOrgWide(teacher));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
