package com.lera.identity_service.controller;

import com.lera.identity_service.dto.UserPermissionDTO;
import com.lera.identity_service.entity.UserPermission;
import com.lera.identity_service.repository.UserPermissionRepository;
import com.lera.identity_service.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * This endpoint answers 200 for every caller: a stored row when one exists, otherwise a
 * synthesised all-denied default. Those two responses were indistinguishable on the wire,
 * and the synthesised one always carries dashboard=true — so the client's "has this user
 * been configured?" test matched every user alive. Every logged-in account therefore ran on
 * the synthesised set, the per-role defaults never applied, and an admin who switched every
 * module off produced a body that read exactly like "not configured".
 */
class UserPermissionConfiguredFlagTest {

    private UserPermissionController controller;
    private UserPermissionRepository repository;

    private final UUID userId = UUID.randomUUID();
    private final AuthUser self = AuthUser.builder().userId(userId).roleName("TEACHER").build();

    @BeforeEach
    void setUp() {
        controller = new UserPermissionController();
        repository = mock(UserPermissionRepository.class);
        ReflectionTestUtils.setField(controller, "userPermissionRepository", repository);
    }

    @Test
    void theSynthesisedDefaultSaysItIsNotConfigured() {
        when(repository.findByUserId(eq(userId))).thenReturn(Optional.empty());

        UserPermissionDTO body = controller.getUserPermissions(userId, self).getBody();

        assertNotNull(body);
        assertEquals(Boolean.FALSE, body.getConfigured(),
                "no row exists, so nobody has decided what this user may see");
        assertEquals(Boolean.TRUE, body.getDashboard(),
                "dashboard stays true here — which is why 'any flag is true' could not be the test");
    }

    @Test
    void astoredRowSaysItIsConfiguredEvenWithEveryModuleOff() {
        UserPermission row = new UserPermission();
        row.setId(UUID.randomUUID());
        row.setUserId(userId);
        row.setDashboard(false);
        row.setStudents(false);
        row.setPayroll(false);
        when(repository.findByUserId(eq(userId))).thenReturn(Optional.of(row));

        UserPermissionDTO body = controller.getUserPermissions(userId, self).getBody();

        assertNotNull(body);
        assertEquals(Boolean.TRUE, body.getConfigured(),
                "an admin saved this row; switching everything off is a decision, not an absence");
        assertEquals(Boolean.FALSE, body.getStudents());
    }
}
