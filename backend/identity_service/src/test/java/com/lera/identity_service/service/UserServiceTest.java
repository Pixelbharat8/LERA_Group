package com.lera.identity_service.service;

import com.lera.identity_service.dto.*;
import com.lera.identity_service.entity.Role;
import com.lera.identity_service.entity.User;
import com.lera.identity_service.repository.CenterRepository;
import com.lera.identity_service.repository.DepartmentRepository;
import com.lera.identity_service.repository.RoleRepository;
import com.lera.identity_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private CenterRepository centerRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private Role studentRole;

    @BeforeEach
    void setUp() {
        studentRole = new Role();
        studentRole.setId(UUID.randomUUID());
        studentRole.setName("STUDENT");

        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@lera.com")
                .fullname("Test User")
                .passwordHash("encoded_password")
                .status("ACTIVE")
                .roleId(studentRole.getId())
                .build();
        testUser.setRole(studentRole);
    }

    @Test
    void register_shouldReturnError_whenEmailExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@lera.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("test@lera.com")).thenReturn(true);

        AuthResponse response = userService.register(request);
        assertFalse(response.isSuccess());
        assertEquals("Email already exists", response.getMessage());
    }

    @Test
    void register_publicRegistration_shouldSetPendingStatus() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@lera.com");
        request.setPassword("password123");
        request.setFullname("New User");
        request.setRoleName("STUDENT");

        when(userRepository.existsByEmail("new@lera.com")).thenReturn(false);
        when(roleRepository.findByName("STUDENT")).thenReturn(Optional.of(studentRole));
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        when(userRepository.findByEmailWithRole("new@lera.com")).thenReturn(Optional.of(testUser));

        AuthResponse response = userService.register(request);
        assertTrue(response.isSuccess());
        assertNull(response.getToken()); // No token for public registration
        assertTrue(response.getMessage().contains("pending"));
    }

    @Test
    void login_shouldFail_whenUserNotFound() {
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@lera.com");
        request.setPassword("password");

        when(userRepository.findByEmailWithRoleIgnoreCase("nonexistent@lera.com")).thenReturn(Optional.empty());

        AuthResponse response = userService.login(request);
        assertFalse(response.isSuccess());
        assertEquals("Invalid email or password", response.getMessage());
    }

    @Test
    void login_shouldFail_whenPasswordWrong() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@lera.com");
        request.setPassword("wrong_password");

        when(userRepository.findByEmailWithRoleIgnoreCase("test@lera.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrong_password", "encoded_password")).thenReturn(false);

        AuthResponse response = userService.login(request);
        assertFalse(response.isSuccess());
        assertEquals("Invalid email or password", response.getMessage());
    }

    @Test
    void login_shouldFail_whenAccountNotActive() {
        testUser.setStatus("PENDING");
        LoginRequest request = new LoginRequest();
        request.setEmail("test@lera.com");
        request.setPassword("password123");

        when(userRepository.findByEmailWithRoleIgnoreCase("test@lera.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encoded_password")).thenReturn(true);

        AuthResponse response = userService.login(request);
        assertFalse(response.isSuccess());
        assertEquals("Account is not active", response.getMessage());
    }

    @Test
    void login_shouldSucceed_withValidCredentials() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@lera.com");
        request.setPassword("password123");

        when(userRepository.findByEmailWithRoleIgnoreCase("test@lera.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encoded_password")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtService.generateToken(testUser)).thenReturn("jwt_token");
        when(jwtService.generateRefreshToken(testUser)).thenReturn("refresh_token");

        AuthResponse response = userService.login(request);
        assertTrue(response.isSuccess());
        assertEquals("jwt_token", response.getToken());
        assertEquals("refresh_token", response.getRefreshToken());
    }

    @Test
    void getAllUsers_shouldReturnMappedDTOs() {
        when(userRepository.findAllWithRelations()).thenReturn(List.of(testUser));

        List<UserDTO> result = userService.getAllUsers();
        assertEquals(1, result.size());
        assertEquals("test@lera.com", result.get(0).getEmail());
    }

    @Test
    void getUserById_shouldReturnUserDTO() {
        when(userRepository.findByIdWithRelations(testUser.getId())).thenReturn(Optional.of(testUser));

        Optional<UserDTO> result = userService.getUserById(testUser.getId());
        assertTrue(result.isPresent());
        assertEquals("Test User", result.get().getFullname());
    }

    @Test
    void deleteUser_shouldReturnTrueWhenExists() {
        when(userRepository.existsById(testUser.getId())).thenReturn(true);

        assertTrue(userService.deleteUser(testUser.getId()));
        verify(userRepository).deleteById(testUser.getId());
    }

    @Test
    void deleteUser_shouldReturnFalseWhenNotExists() {
        UUID randomId = UUID.randomUUID();
        when(userRepository.existsById(randomId)).thenReturn(false);

        assertFalse(userService.deleteUser(randomId));
        verify(userRepository, never()).deleteById(any());
    }
}
