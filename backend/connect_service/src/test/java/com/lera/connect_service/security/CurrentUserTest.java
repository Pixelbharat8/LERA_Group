package com.lera.connect_service.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link CurrentUser}. The whole point of this helper is that
 * controllers can derive identity from the JWT instead of trusting body
 * fields, so the test contract is small and behavioural — get the principal,
 * map roles, and compare ids.
 */
class CurrentUserTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void unauthenticated_get_returnsEmpty() {
        assertThat(CurrentUser.get()).isEmpty();
        assertThat(CurrentUser.id()).isEmpty();
        assertThat(CurrentUser.role()).isNull();
        assertThat(CurrentUser.isStaff()).isFalse();
    }

    @Test
    void parent_isNotStaff() {
        login("PARENT", UUID.randomUUID());
        assertThat(CurrentUser.isStaff()).isFalse();
    }

    @Test
    void teacher_isStaff_andRoleIsCaseInsensitive() {
        login("teacher", UUID.randomUUID());
        assertThat(CurrentUser.isStaff()).isTrue();
        assertThat(CurrentUser.role()).isEqualTo("teacher");
    }

    @Test
    void chairman_isStaff() {
        login("CHAIRMAN", UUID.randomUUID());
        assertThat(CurrentUser.isStaff()).isTrue();
    }

    @Test
    void isSelfOrStaff_matchesOwnId() {
        UUID me = UUID.randomUUID();
        login("PARENT", me);
        assertThat(CurrentUser.isSelfOrStaff(me)).isTrue();
        assertThat(CurrentUser.isSelfOrStaff(UUID.randomUUID())).isFalse();
    }

    @Test
    void isSelfOrStaff_passesForStaffEvenIfDifferentId() {
        login("CENTER_MANAGER", UUID.randomUUID());
        assertThat(CurrentUser.isSelfOrStaff(UUID.randomUUID())).isTrue();
    }

    @Test
    void isSelfOrStaff_nullId_isFalse() {
        login("CHAIRMAN", UUID.randomUUID());
        // Chairman could "match" anything; passing null must always fail
        // because there's no caller to compare against and we don't want
        // controllers to accidentally allow operating on a null subject.
        assertThat(CurrentUser.isSelfOrStaff(null)).isFalse();
    }

    private static void login(String role, UUID userId) {
        AuthUser u = AuthUser.builder()
                .userId(userId)
                .roleName(role)
                .email("test@lera.io")
                .build();
        var auth = new UsernamePasswordAuthenticationToken(u, "n/a", java.util.List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
