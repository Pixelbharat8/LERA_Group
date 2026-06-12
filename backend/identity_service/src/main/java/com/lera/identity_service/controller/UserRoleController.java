package com.lera.identity_service.controller;

import com.lera.identity_service.entity.UserRole;
import com.lera.identity_service.model.ApiResponse;
import com.lera.identity_service.service.UserRoleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/user-roles")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class UserRoleController {

    private final UserRoleService userRoleService;

    public UserRoleController(UserRoleService userRoleService) {
        this.userRoleService = userRoleService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserRole>> assignRole(
            @RequestParam UUID userId,
            @RequestParam UUID roleId,
            @RequestParam UUID assignedBy) {
        try {
            UserRole userRole = userRoleService.assignRole(userId, roleId, assignedBy);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(userRole, "Role assigned successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false,
                            e.getMessage() != null && !e.getMessage().isBlank()
                                    ? e.getMessage()
                                    : "Invalid request",
                            null));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<UserRole>>> getUserRoles(@PathVariable UUID userId) {
        List<UserRole> roles = userRoleService.getUserRoles(userId);
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    @GetMapping("/role/{roleId}")
    public ResponseEntity<ApiResponse<List<UserRole>>> getRoleUsers(@PathVariable UUID roleId) {
        List<UserRole> users = userRoleService.getRoleUsers(roleId);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> removeRole(
            @RequestParam UUID userId,
            @RequestParam UUID roleId) {
        userRoleService.removeRole(userId, roleId);
        return ResponseEntity.ok(ApiResponse.success(null, "Role removed successfully"));
    }

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Boolean>> hasRole(
            @RequestParam UUID userId,
            @RequestParam UUID roleId) {
        boolean hasRole = userRoleService.hasRole(userId, roleId);
        return ResponseEntity.ok(ApiResponse.success(hasRole));
    }
}
