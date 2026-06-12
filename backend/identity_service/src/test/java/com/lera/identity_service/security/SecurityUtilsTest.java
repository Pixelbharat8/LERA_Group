package com.lera.identity_service.security;

import com.lera.identity_service.dto.UserDTO;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Authorization predicates — a wrong answer here is a privilege-escalation / data-leak,
 * so the role sets and the same-center rule are pinned by tests.
 */
class SecurityUtilsTest {

    private static AuthUser user(String role, UUID userId, UUID centerId) {
        return AuthUser.builder().roleName(role).userId(userId).centerId(centerId).build();
    }

    private static UserDTO target(UUID id, UUID centerId) {
        return UserDTO.builder().id(id).centerId(centerId).build();
    }

    @Test
    void isSuperAdmin_onlyForSuperAdminCaseInsensitive() {
        assertTrue(SecurityUtils.isSuperAdmin(user("SUPER_ADMIN", null, null)));
        assertTrue(SecurityUtils.isSuperAdmin(user("super_admin", null, null)));
        assertFalse(SecurityUtils.isSuperAdmin(user("CHAIRMAN", null, null)));
        assertFalse(SecurityUtils.isSuperAdmin(null));
    }

    @Test
    void isOrgWide_coversAllOrgWideRoles() {
        for (String r : new String[]{"SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR"}) {
            assertTrue(SecurityUtils.isOrgWide(user(r, null, null)), r + " should be org-wide");
            assertTrue(SecurityUtils.isOrgWide(user(r.toLowerCase(), null, null)), r + " case-insensitive");
        }
        assertFalse(SecurityUtils.isOrgWide(user("TEACHER", null, null)));
        assertFalse(SecurityUtils.isOrgWide(user(null, null, null)));
        assertFalse(SecurityUtils.isOrgWide(null));
    }

    @Test
    void isCenterDirectoryRole_coversCenterStaffButNotOrgWideOrOutsiders() {
        for (String r : new String[]{"CENTER_MANAGER", "CENTER_ADMIN", "ACADEMIC_MANAGER",
                "TEACHER", "STAFF", "TEACHING_ASSISTANT", "TA"}) {
            assertTrue(SecurityUtils.isCenterDirectoryRole(user(r, null, null)), r);
        }
        assertFalse(SecurityUtils.isCenterDirectoryRole(user("CHAIRMAN", null, null)));
        assertFalse(SecurityUtils.isCenterDirectoryRole(user("PARENT", null, null)));
        assertFalse(SecurityUtils.isCenterDirectoryRole(null));
    }

    @Test
    void canViewOtherUserProfile_nullsAreDenied() {
        UserDTO t = target(UUID.randomUUID(), UUID.randomUUID());
        assertFalse(SecurityUtils.canViewOtherUserProfile(null, t));
        assertFalse(SecurityUtils.canViewOtherUserProfile(user("CHAIRMAN", UUID.randomUUID(), null), null));
        assertFalse(SecurityUtils.canViewOtherUserProfile(
                user("CHAIRMAN", UUID.randomUUID(), null), target(null, null)));
    }

    @Test
    void canViewOtherUserProfile_selfIsAlwaysAllowed() {
        UUID id = UUID.randomUUID();
        // self even with mismatched centers and a non-directory role
        assertTrue(SecurityUtils.canViewOtherUserProfile(
                user("PARENT", id, UUID.randomUUID()), target(id, UUID.randomUUID())));
    }

    @Test
    void canViewOtherUserProfile_orgWideSeesAnyone() {
        assertTrue(SecurityUtils.canViewOtherUserProfile(
                user("CHAIRMAN", UUID.randomUUID(), null), target(UUID.randomUUID(), UUID.randomUUID())));
    }

    @Test
    void canViewOtherUserProfile_centerStaffOnlySameCenter() {
        UUID centerA = UUID.randomUUID();
        UUID centerB = UUID.randomUUID();
        assertTrue(SecurityUtils.canViewOtherUserProfile(
                user("TEACHER", UUID.randomUUID(), centerA), target(UUID.randomUUID(), centerA)));
        assertFalse(SecurityUtils.canViewOtherUserProfile(
                user("TEACHER", UUID.randomUUID(), centerA), target(UUID.randomUUID(), centerB)));
        // null viewer center never matches
        assertFalse(SecurityUtils.canViewOtherUserProfile(
                user("TEACHER", UUID.randomUUID(), null), target(UUID.randomUUID(), centerA)));
    }

    @Test
    void canViewOtherUserProfile_outsiderRoleDenied() {
        UUID center = UUID.randomUUID();
        // PARENT is neither org-wide nor a center-directory role → denied even same center
        assertFalse(SecurityUtils.canViewOtherUserProfile(
                user("PARENT", UUID.randomUUID(), center), target(UUID.randomUUID(), center)));
    }
}
