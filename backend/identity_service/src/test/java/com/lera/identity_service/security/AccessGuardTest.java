package com.lera.identity_service.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AccessGuardTest {

    private static final UUID CENTER_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID CENTER_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private final AccessGuard guard = new AccessGuard();

    @BeforeEach
    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    private void login(AuthUser user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, null));
    }

    @Test
    void assertCenterAccess_orgWide_allowsAnyCenter() {
        AuthUser ceo = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("CEO")
                .build();
        login(ceo);
        assertDoesNotThrow(() -> guard.assertCenterAccess(CENTER_B));
    }

    @Test
    void assertCenterAccess_centerStaff_sameCenter_ok() {
        AuthUser admin = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("CENTER_ADMIN")
                .build();
        login(admin);
        assertDoesNotThrow(() -> guard.assertCenterAccess(CENTER_A));
    }

    @Test
    void assertCenterAccess_centerStaff_otherCenter_forbidden() {
        AuthUser admin = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("CENTER_ADMIN")
                .build();
        login(admin);
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> guard.assertCenterAccess(CENTER_B));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void assertMayMutateUserByCenter_nonOrg_requiresMatchingCenter() {
        AuthUser mgr = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("CENTER_MANAGER")
                .build();
        login(mgr);
        assertDoesNotThrow(() -> guard.assertMayMutateUserByCenter(CENTER_A));
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> guard.assertMayMutateUserByCenter(CENTER_B));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void assertMayMutateUserByCenter_orgWide_allowsAny() {
        AuthUser dir = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("DIRECTOR")
                .build();
        login(dir);
        assertDoesNotThrow(() -> guard.assertMayMutateUserByCenter(CENTER_B));
    }
}
