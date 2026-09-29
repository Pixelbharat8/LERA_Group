package com.lera.identity_service.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * /api/centers used to report settings_access, so the Chairman's "Centers" switch was inert
 * while "Settings" silently governed centres. Centres now answer to their own column — but the
 * granular role code must stay settings.*, because role_permissions seeds no centers.* code and
 * demanding one would deny every non-god-mode caller.
 */
class PermissionGateCentersColumnTest {

    private final PermissionGateFilter filter = new PermissionGateFilter(null);

    @Test
    void centresAnswerToTheCentersToggle() {
        assertEquals("centers_access", filter.userPermissionColumn("/api/centers"));
        assertEquals("centers_access", filter.userPermissionColumn("/api/centers/9/rooms"));
    }

    @Test
    void theRestOfTheSettingsGroupIsUnaffected() {
        assertEquals("settings_access", filter.userPermissionColumn("/api/roles"));
        assertEquals("settings_access", filter.userPermissionColumn("/api/departments"));
        assertEquals("settings_access", filter.userPermissionColumn("/api/system-settings"));
        assertEquals("users_access", filter.userPermissionColumn("/api/users"));
    }

    @Test
    void theRoleCodeForCentresIsStillSettings() {
        // Were this to become "centers", the role layer would demand an unseeded code.
        assertEquals("settings", filter.baseModule("/api/centers"));
    }

    @Test
    void selfServiceOnOnesOwnRecordStaysUngated() {
        // A low-privilege account must still reach its own profile and forced password change.
        assertNull(filter.userPermissionColumn("/api/users/me"));
        assertNull(filter.userPermissionColumn("/api/users/me/password"));
    }
}
