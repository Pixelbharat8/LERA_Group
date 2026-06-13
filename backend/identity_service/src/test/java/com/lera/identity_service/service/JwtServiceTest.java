package com.lera.identity_service.service;

import com.lera.identity_service.entity.Role;
import com.lera.identity_service.entity.User;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey",
                "bGVyYUFjYWRlbXlTZWNyZXRLZXkyMDI0VmVyeUxvbmdTZWN1cmVLZXlGb3JKd3RUb2tlbkdlbmVyYXRpb24=");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604800000L);

        Role role = new Role();
        role.setId(UUID.randomUUID());
        role.setName("SUPER_ADMIN");

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("admin@lera.com");
        testUser.setPasswordHash("hashed");
        testUser.setRoleId(role.getId());
        testUser.setCenterId(UUID.randomUUID());
        testUser.setRole(role);
    }

    @Test
    void generateToken_shouldReturnValidJwt() {
        String token = jwtService.generateToken(testUser);
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void extractUsername_shouldReturnEmail() {
        String token = jwtService.generateToken(testUser);
        String email = jwtService.extractUsername(token);
        assertEquals("admin@lera.com", email);
    }

    @Test
    void isTokenValid_shouldReturnTrueForValidToken() {
        String token = jwtService.generateToken(testUser);
        assertTrue(jwtService.isTokenValid(token, testUser));
    }

    @Test
    void isTokenValid_shouldReturnFalseForWrongUser() {
        String token = jwtService.generateToken(testUser);

        User otherUser = new User();
        otherUser.setEmail("other@lera.com");
        assertFalse(jwtService.isTokenValid(token, otherUser));
    }

    @Test
    void generateToken_shouldIncludeRoleName() {
        String token = jwtService.generateToken(testUser);
        String roleName = jwtService.extractClaim(token, claims -> claims.get("roleName", String.class));
        assertEquals("SUPER_ADMIN", roleName);
    }

    @Test
    void generateToken_shouldIncludeUserId() {
        String token = jwtService.generateToken(testUser);
        String userId = jwtService.extractClaim(token, claims -> claims.get("userId", String.class));
        assertEquals(testUser.getId().toString(), userId);
    }

    @Test
    void generateToken_shouldIncludeCenterId() {
        String token = jwtService.generateToken(testUser);
        String centerId = jwtService.extractClaim(token, claims -> claims.get("centerId", String.class));
        assertEquals(testUser.getCenterId().toString(), centerId);
    }

    @Test
    void generateRefreshToken_shouldReturnValidToken() {
        String refreshToken = jwtService.generateRefreshToken(testUser);
        assertNotNull(refreshToken);
        String email = jwtService.extractUsername(refreshToken);
        assertEquals("admin@lera.com", email);
    }
}
