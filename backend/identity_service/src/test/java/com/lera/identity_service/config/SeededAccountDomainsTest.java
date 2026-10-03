package com.lera.identity_service.config;

import com.lera.identity_service.entity.Role;
import com.lera.identity_service.entity.User;
import com.lera.identity_service.repository.PermissionRepository;
import com.lera.identity_service.repository.RolePermissionRepository;
import com.lera.identity_service.repository.RoleRepository;
import com.lera.identity_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * DataLoader is a CommandLineRunner with no @Profile guard, so it runs in production too —
 * spring.sql.init.mode=never stops data.sql but not this. It used to create a SUPER_ADMIN on
 * a hard-coded domain LERA does not own. POST /api/auth/forgot-password is permitAll and mails
 * the reset link to whatever address is on the account, so the day SMTP is configured that
 * seeded account hands a stranger a SUPER_ADMIN password reset.
 *
 * Every address this seeder creates must therefore sit on a domain LERA controls.
 */
class SeededAccountDomainsTest {

    private static final String OWNED_DOMAIN = "@leraacademy.edu.vn";

    private UserRepository userRepository;
    private RoleRepository roleRepository;
    private DataLoader loader;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        roleRepository = mock(RoleRepository.class);
        RolePermissionRepository rolePermissionRepository = mock(RolePermissionRepository.class);
        PermissionRepository permissionRepository = mock(PermissionRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(encoder.encode(anyString())).thenReturn("hashed");
        // Roles do not exist yet, and save() hands back a row with an id, as the real one does.
        when(roleRepository.findByName(anyString())).thenReturn(Optional.empty());
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> {
            Role r = inv.getArgument(0);
            if (r.getId() == null) r.setId(UUID.randomUUID());
            return r;
        });
        when(permissionRepository.findByCode(anyString())).thenReturn(Optional.empty());
        when(rolePermissionRepository.findByRoleId(any())).thenReturn(List.of());

        loader = new DataLoader(userRepository, roleRepository,
                rolePermissionRepository, permissionRepository, encoder);
        ReflectionTestUtils.setField(loader, "adminSeedEmail", "admin@leraacademy.edu.vn");
        ReflectionTestUtils.setField(loader, "adminSeedPassword", "set-by-env");
        ReflectionTestUtils.setField(loader, "chairmanSeedPassword", "set-by-env");
        ReflectionTestUtils.setField(loader, "ceoSeedPassword", "set-by-env");
    }

    @Test
    void everySeededAccountSitsOnADomainLeraOwns() {
        loader.run();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository, atLeastOnce()).save(saved.capture());

        List<User> users = saved.getAllValues();
        assertFalse(users.isEmpty(), "the seeder must create the founding accounts");
        for (User u : users) {
            assertNotNull(u.getEmail());
            assertTrue(u.getEmail().toLowerCase().endsWith(OWNED_DOMAIN),
                    "seeded account " + u.getEmail() + " is on a domain LERA does not own; "
                            + "forgot-password would mail its reset link to a stranger");
        }
    }

    @Test
    void theAdminAddressIsWhateverTheEnvironmentConfigures() {
        ReflectionTestUtils.setField(loader, "adminSeedEmail", "ops@leraacademy.edu.vn");

        loader.run();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository, atLeastOnce()).save(saved.capture());
        assertTrue(saved.getAllValues().stream()
                        .anyMatch(u -> "ops@leraacademy.edu.vn".equals(u.getEmail())),
                "the seeded admin address must come from configuration, not a literal");
    }
}
