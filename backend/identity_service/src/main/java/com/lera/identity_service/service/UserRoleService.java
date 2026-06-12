package com.lera.identity_service.service;

import com.lera.identity_service.entity.UserRole;
import com.lera.identity_service.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserRoleService {

    private final UserRoleRepository userRoleRepository;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public List<UserRole> getUserRoles(UUID userId) {
        log.info("Fetching roles for user: {}", userId);
        return userRoleRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<UserRole> getRoleUsers(UUID roleId) {
        log.info("Fetching users for role: {}", roleId);
        return userRoleRepository.findByRoleId(roleId);
    }

    @Transactional
    public UserRole assignRole(UUID userId, UUID roleId, UUID assignedBy) {
        log.info("Assigning role {} to user {}", roleId, userId);

        if (userRoleRepository.existsByUserIdAndRoleId(userId, roleId)) {
            throw new IllegalArgumentException("User already has this role");
        }

        UserRole userRole = UserRole.builder()
                .userId(userId)
                .roleId(roleId)
                .assignedBy(assignedBy)
                .assignedAt(LocalDateTime.now())
                .build();

        UserRole saved = userRoleRepository.save(userRole);

        activityLogService.log(assignedBy, null, "ROLE_ASSIGNED",
                String.format("Role %s assigned to user %s", roleId, userId));

        return saved;
    }

    /**
     * Convenience overload for controllers that don't provide an actor.
     */
    @Transactional
    public void removeRole(UUID userId, UUID roleId) {
        removeRole(userId, roleId, null);
    }

    @Transactional
    public void removeRole(UUID userId, UUID roleId, UUID removedBy) {
        log.info("Removing role {} from user {}", roleId, userId);

        if (!userRoleRepository.existsByUserIdAndRoleId(userId, roleId)) {
            throw new IllegalArgumentException("User does not have this role");
        }

        userRoleRepository.deleteByUserIdAndRoleId(userId, roleId);

        activityLogService.log(removedBy, null, "ROLE_REMOVED",
                String.format("Role %s removed from user %s", roleId, userId));
    }

    @Transactional(readOnly = true)
    public boolean hasRole(UUID userId, UUID roleId) {
        return userRoleRepository.existsByUserIdAndRoleId(userId, roleId);
    }
}
