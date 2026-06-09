package com.lera.identity_service.service;

import com.lera.identity_service.dto.*;
import com.lera.identity_service.entity.Center;
import com.lera.identity_service.entity.Department;
import com.lera.identity_service.entity.Role;
import com.lera.identity_service.entity.User;
import com.lera.identity_service.repository.CenterRepository;
import com.lera.identity_service.repository.DepartmentRepository;
import com.lera.identity_service.repository.RoleRepository;
import com.lera.identity_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final CenterRepository centerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        return register(request, false);
    }

    /**
     * Register a new user.
     * @param request      registration data
     * @param isInternal   true when called from a trusted service (e.g. ExcelImport); allows any role
     */
    public AuthResponse register(RegisterRequest request, boolean isInternal) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Email already exists")
                    .build();
        }
        
        // Determine allowed role and status
        String requestedRole = request.getRoleName();
        String userStatus;
        if (!isInternal) {
            // Public registration: always create as STUDENT with PENDING status
            // An admin/center-manager must review & approve before the account becomes ACTIVE
            java.util.Set<String> publicRoles = java.util.Set.of("STUDENT", "PARENT");
            if (requestedRole == null || !publicRoles.contains(requestedRole.toUpperCase())) {
                requestedRole = "STUDENT"; // Force default for public callers
            }
            userStatus = "PENDING"; // Always PENDING until admin approves
        } else {
            // Internal (admin-created) users can be ACTIVE immediately
            userStatus = request.getStatus() != null ? request.getStatus() : "ACTIVE";
        }
        
        // Get role
        Role role = roleRepository.findByName(requestedRole)
                .orElse(roleRepository.findByName("STUDENT").orElse(null));
        
        // Create user
        User user = User.builder()
                .centerId(request.getCenterId())
                .roleId(role != null ? role.getId() : null)
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullname(request.getFullname())
                .fullnameVi(request.getFullnameVi())
                .status(userStatus)
                .emailVerified(false)
                // Organization hierarchy fields
                .departmentId(request.getDepartmentId())
                .reportsTo(request.getReportsTo())
                .jobTitle(request.getJobTitle())
                .employmentType(request.getEmploymentType())
                .orgLevel(request.getOrgLevel())
                .build();
        
        User savedUser = userRepository.save(user);
        
        // Re-fetch with role so DTO includes roleName
        savedUser = userRepository.findByEmailWithRole(savedUser.getEmail()).orElse(savedUser);
        
        // For public registration: do NOT auto-login; return success without token
        // The user must wait for admin approval before they can log in
        if (!isInternal) {
            return AuthResponse.builder()
                    .success(true)
                    .message("Registration successful! Your account is pending approval. An administrator will review and activate your account.")
                    .token(null)
                    .refreshToken(null)
                    .user(mapToDTO(savedUser))
                    .build();
        }
        
        // Internal creation: generate token (admin-created users are ACTIVE)
        String token = jwtService.generateToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);
        
        return AuthResponse.builder()
                .success(true)
                .message("Registration successful")
                .token(token)
                .refreshToken(refreshToken)
                .user(mapToDTO(savedUser))
                .build();
    }
    
    public AuthResponse login(LoginRequest request) {
        String emailInput = request.getEmail() != null ? request.getEmail().trim() : "";
        Optional<User> userOpt = userRepository.findByEmailWithRoleIgnoreCase(emailInput);
        
        if (userOpt.isEmpty()) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid email or password")
                    .build();
        }
        
        User user = userOpt.get();
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid email or password")
                    .build();
        }
        
        if (!"ACTIVE".equals(user.getStatus())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Account is not active")
                    .build();
        }
        
        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        // Generate tokens
        String token = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        
        return AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .token(token)
                .refreshToken(refreshToken)
                .user(mapToDTO(user))
                .build();
    }
    
    @Cacheable(value = "users", key = "'all'")
    public List<UserDTO> getAllUsers() {
        return userRepository.findAllWithRelations().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @Cacheable(value = "users", key = "#id")
    public Optional<UserDTO> getUserById(UUID id) {
        return userRepository.findByIdWithRelations(id).map(this::mapToDTO);
    }
    
    @Cacheable(value = "users", key = "'center-' + #centerId")
    public List<UserDTO> getUsersByCenter(UUID centerId) {
        return userRepository.findByCenterIdWithRelations(centerId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    public List<UserDTO> searchUsers(String search) {
        return userRepository.searchUsers(search).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<UserDTO> searchUsersInCenter(UUID centerId, String search) {
        return userRepository.searchUsersInCenter(centerId, search).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @CacheEvict(value = "users", allEntries = true)
    @Transactional
    public Optional<UserDTO> updateUser(UUID id, RegisterRequest request) {
        return userRepository.findById(id).map(user -> {
            if (request.getFullname() != null) user.setFullname(request.getFullname());
            if (request.getFullnameVi() != null) user.setFullnameVi(request.getFullnameVi());
            if (request.getPhone() != null) user.setPhone(request.getPhone());
            if (request.getCenterId() != null) user.setCenterId(request.getCenterId());
            if (request.getStatus() != null) user.setStatus(request.getStatus());

            // Update password if provided
            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            }
            
            // Update role if roleName is provided
            if (request.getRoleName() != null) {
                roleRepository.findByName(request.getRoleName())
                    .ifPresent(role -> user.setRoleId(role.getId()));
            }
            
            // Update organization hierarchy fields
            if (request.getDepartmentId() != null) user.setDepartmentId(request.getDepartmentId());
            if (request.getReportsTo() != null) user.setReportsTo(request.getReportsTo());
            if (request.getJobTitle() != null) user.setJobTitle(request.getJobTitle());
            if (request.getEmploymentType() != null) user.setEmploymentType(request.getEmploymentType());
            if (request.getOrgLevel() != null) user.setOrgLevel(request.getOrgLevel());
            
            return mapToDTO(userRepository.save(user));
        });
    }
    
    @CacheEvict(value = "users", allEntries = true)
    @Transactional
    public boolean deleteUser(UUID id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    @CacheEvict(value = "users", allEntries = true)
    @Transactional
    public Optional<UserDTO> updateUserStatus(UUID id, String status) {
        return userRepository.findById(id).map(user -> {
            user.setStatus(status);
            return mapToDTO(userRepository.save(user));
        });
    }

    @Transactional
    public Optional<UserDTO> updatePassword(UUID id, String newPassword) {
        return userRepository.findById(id).map(user -> {
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            return mapToDTO(userRepository.save(user));
        });
    }

    public List<UserDTO> getUsersByApprovalStatus(String approvalStatus) {
        return userRepository.findByApprovalStatusWithRelations(approvalStatus).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Verify a plain-text password against the stored hash for the given user.
     * Used by self-service "change my password" flow to require the current password.
     */
    public boolean verifyPassword(UUID userId, String plainPassword) {
        if (userId == null || plainPassword == null) return false;
        return userRepository.findById(userId)
                .map(u -> passwordEncoder.matches(plainPassword, u.getPasswordHash()))
                .orElse(false);
    }

    /**
     * Approve or reject a user's pending registration. Updates approval columns
     * (approval_status, approved_by, approved_at, rejection_reason) and, on
     * approval, flips status from INACTIVE → ACTIVE so the user can log in.
     */
    @CacheEvict(value = "users", allEntries = true)
    @Transactional
    public Optional<UserDTO> setApprovalStatus(UUID userId, String approvalStatus,
                                               UUID approverId, String rejectionReason) {
        return userRepository.findById(userId).map(user -> {
            user.setApprovalStatus(approvalStatus);
            user.setApprovedBy(approverId);
            user.setApprovedAt(LocalDateTime.now());
            if ("APPROVED".equalsIgnoreCase(approvalStatus)) {
                user.setStatus("ACTIVE");
                user.setRejectionReason(null);
            } else if ("REJECTED".equalsIgnoreCase(approvalStatus)) {
                user.setStatus("INACTIVE");
                user.setRejectionReason(rejectionReason);
            }
            return mapToDTO(userRepository.save(user));
        });
    }
    
    private UserDTO mapToDTO(User user) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
        
        // Use eagerly-loaded relations if available, fallback to repository queries
        String roleName = null;
        if (user.getRole() != null) {
            roleName = user.getRole().getName();
        } else if (user.getRoleId() != null) {
            roleName = roleRepository.findById(user.getRoleId())
                    .map(Role::getName)
                    .orElse(null);
        }
        
        String departmentName = null;
        if (user.getDepartment() != null) {
            departmentName = user.getDepartment().getDepartmentName();
        } else if (user.getDepartmentId() != null) {
            departmentName = departmentRepository.findById(user.getDepartmentId())
                    .map(Department::getDepartmentName)
                    .orElse(null);
        }
        
        String reportsToName = null;
        if (user.getManager() != null) {
            reportsToName = user.getManager().getFullname();
        } else if (user.getReportsTo() != null) {
            reportsToName = userRepository.findById(user.getReportsTo())
                    .map(User::getFullname)
                    .orElse(null);
        }
        
        // Count direct reports
        int directReportsCount = userRepository.countByReportsTo(user.getId());
        
        String centerName = null;
        if (user.getCenter() != null) {
            centerName = user.getCenter().getName();
        } else if (user.getCenterId() != null) {
            centerName = centerRepository.findById(user.getCenterId())
                    .map(Center::getName)
                    .orElse(null);
        }
        
        return UserDTO.builder()
                .id(user.getId())
                .centerId(user.getCenterId())
                .centerName(centerName)
                .roleId(user.getRoleId())
                .roleName(roleName)
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullname(user.getFullname())
                .fullnameVi(user.getFullnameVi())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .isActive("ACTIVE".equalsIgnoreCase(user.getStatus()))
                .emailVerified(user.getEmailVerified())
                .lastLogin(user.getLastLogin() != null ? user.getLastLogin().format(formatter) : null)
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().format(formatter) : null)
                .departmentId(user.getDepartmentId())
                .departmentName(departmentName)
                .reportsTo(user.getReportsTo())
                .reportsToName(reportsToName)
                .directReports(directReportsCount)
                .jobTitle(user.getJobTitle())
                .employmentType(user.getEmploymentType())
                .orgLevel(user.getOrgLevel())
                .build();
    }
}
