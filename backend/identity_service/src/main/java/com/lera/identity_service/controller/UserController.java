package com.lera.identity_service.controller;

import com.lera.identity_service.dto.AuthResponse;
import com.lera.identity_service.dto.RegisterRequest;
import com.lera.identity_service.dto.UserDTO;
import com.lera.identity_service.security.AccessGuard;
import com.lera.identity_service.security.AuthUser;
import com.lera.identity_service.security.SecurityUtils;
import com.lera.identity_service.service.AuditService;
import com.lera.identity_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    private final AuditService auditService;
    private final AccessGuard accessGuard;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    public ResponseEntity<List<UserDTO>> getAllUsers(
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false, name = "approval_status") String approvalStatus,
            @RequestParam(required = false) String approvalStatusCamel,
            @AuthenticationPrincipal AuthUser authUser) {
        AuthUser viewer = authUser != null ? authUser : SecurityUtils.requireUser();
        String effectiveApprovalStatus = approvalStatus != null ? approvalStatus : approvalStatusCamel;
        if (effectiveApprovalStatus != null && !effectiveApprovalStatus.isBlank()) {
            List<UserDTO> list = userService.getUsersByApprovalStatus(effectiveApprovalStatus);
            if (!SecurityUtils.isOrgWide(viewer)) {
                UUID c = viewer.getCenterId();
                if (c == null) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                list = list.stream().filter(u -> c.equals(u.getCenterId())).collect(Collectors.toList());
            }
            return ResponseEntity.ok(list);
        }
        if (centerId != null) {
            accessGuard.assertCenterAccess(centerId);
            return ResponseEntity.ok(userService.getUsersByCenter(centerId));
        }
        if (!SecurityUtils.isOrgWide(viewer)) {
            UUID c = viewer.getCenterId();
            if (c == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.ok(userService.getUsersByCenter(c));
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO> getUserById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        AuthUser viewer = authUser != null ? authUser : SecurityUtils.requireUser();
        return userService.getUserById(id)
                .map(target -> {
                    if (!SecurityUtils.canViewOtherUserProfile(viewer, target)) {
                        return ResponseEntity.<UserDTO>status(HttpStatus.FORBIDDEN).<UserDTO>build();
                    }
                    return ResponseEntity.ok(target);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/center/{centerId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF','TEACHING_ASSISTANT','TA')")
    public ResponseEntity<List<UserDTO>> getUsersByCenter(@PathVariable UUID centerId) {
        accessGuard.assertCenterAccess(centerId);
        return ResponseEntity.ok(userService.getUsersByCenter(centerId));
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF','TEACHING_ASSISTANT','TA')")
    public ResponseEntity<List<UserDTO>> searchUsers(
            @RequestParam String q,
            @AuthenticationPrincipal AuthUser authUser) {
        AuthUser viewer = authUser != null ? authUser : SecurityUtils.requireUser();
        if (SecurityUtils.isOrgWide(viewer)) {
            return ResponseEntity.ok(userService.searchUsers(q));
        }
        UUID c = viewer.getCenterId();
        if (c == null || !SecurityUtils.isCenterDirectoryRole(viewer)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        accessGuard.assertCenterAccess(c);
        return ResponseEntity.ok(userService.searchUsersInCenter(c, q));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable UUID id,
            // NOT @Valid: edits are partial (RegisterRequest requires a password for *creation*;
            // requiring it on edit blocked role/status changes). updateUser() guards each field.
            @RequestBody RegisterRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        Map<String, Object> response = new HashMap<>();
        AuthUser actor = authUser != null ? authUser : SecurityUtils.requireUser();
        Optional<UserDTO> existingOpt = userService.getUserById(id);
        if (existingOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(404).body(response);
        }
        UserDTO existing = existingOpt.get();
        accessGuard.assertMayMutateUserByCenter(existing.getCenterId());
        if (request.getCenterId() != null
                && (existing.getCenterId() == null || !request.getCenterId().equals(existing.getCenterId()))
                && !SecurityUtils.isOrgWide(actor)) {
            response.put("success", false);
            response.put("message", "Only organization-wide roles may move users between centers");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
        return userService.updateUser(id, request)
                .map(user -> {
                    response.put("success", true);
                    response.put("message", "User updated successfully");
                    response.put("data", user);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "User not found");
                    return ResponseEntity.status(404).body(response);
                });
    }
    
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<Map<String, Object>> createUsersBulk(@Valid @RequestBody List<RegisterRequest> users) {
        Map<String, Object> response = new HashMap<>();
        List<UserDTO> createdUsers = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        
        for (int i = 0; i < users.size(); i++) {
            RegisterRequest request = users.get(i);
            try {
                AuthResponse authResponse = userService.register(request);
                if (authResponse.isSuccess() && authResponse.getUser() != null) {
                    createdUsers.add(authResponse.getUser());
                } else {
                    errors.add("Row " + (i + 1) + ": " + authResponse.getMessage());
                }
            } catch (Exception e) {
                errors.add("Row " + (i + 1) + ": " + "An unexpected error occurred");
            }
        }
        
        response.put("success", errors.isEmpty());
        response.put("message", "Created " + createdUsers.size() + " users" + 
                    (errors.isEmpty() ? "" : ", " + errors.size() + " failed"));
        response.put("data", createdUsers);
        response.put("errors", errors);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable UUID id) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (userService.deleteUser(id)) {
                response.put("success", true);
                response.put("message", "User deleted successfully");
                return ResponseEntity.ok(response);
            }
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(404).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "An unexpected error occurred");
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<Map<String, Object>> updateUserStatus(@PathVariable UUID id, @RequestParam String status) {
        Map<String, Object> response = new HashMap<>();
        Optional<UserDTO> target = userService.getUserById(id);
        if (target.isEmpty()) {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(404).body(response);
        }
        accessGuard.assertMayMutateUserByCenter(target.get().getCenterId());
        return userService.updateUserStatus(id, status)
                .map(user -> {
                    response.put("success", true);
                    response.put("message", "Status updated successfully");
                    response.put("data", user);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "User not found");
                    return ResponseEntity.status(404).body(response);
                });
    }

    @PutMapping("/{id}/password")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<Map<String, Object>> updatePassword(
            @PathVariable UUID id,
            @Valid @RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();
        String newPassword = body.get("password");
        
        if (newPassword == null || newPassword.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Password is required");
            return ResponseEntity.badRequest().body(response);
        }
        
        if (newPassword.length() < 6) {
            response.put("success", false);
            response.put("message", "Password must be at least 6 characters");
            return ResponseEntity.badRequest().body(response);
        }

        Optional<UserDTO> target = userService.getUserById(id);
        if (target.isEmpty()) {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(404).body(response);
        }
        accessGuard.assertMayMutateUserByCenter(target.get().getCenterId());

        return userService.updatePassword(id, newPassword)
                .map(user -> {
                    response.put("success", true);
                    response.put("message", "Password updated successfully");
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "User not found");
                    return ResponseEntity.status(404).body(response);
                });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Self-service endpoints — current-user operations using JWT principal
    // ─────────────────────────────────────────────────────────────────────

    @GetMapping("/me/settings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getMySettings(@AuthenticationPrincipal AuthUser authUser) {
        Map<String, Object> response = new HashMap<>();
        if (authUser == null) {
            response.put("success", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.status(401).body(response);
        }
        return userService.getUserById(authUser.getUserId())
                .map(user -> {
                    response.put("success", true);
                    response.put("data", user);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "User not found");
                    return ResponseEntity.status(404).body(response);
                });
    }

    @PutMapping("/me/settings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> updateMySettings(
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody RegisterRequest request) {
        Map<String, Object> response = new HashMap<>();
        if (authUser == null) {
            response.put("success", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.status(401).body(response);
        }
        return userService.updateUser(authUser.getUserId(), request)
                .map(user -> {
                    response.put("success", true);
                    response.put("message", "Settings updated successfully");
                    response.put("data", user);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "User not found");
                    return ResponseEntity.status(404).body(response);
                });
    }

    @PutMapping("/me/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> changeMyPassword(
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();
        if (authUser == null) {
            response.put("success", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.status(401).body(response);
        }

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            newPassword = body.get("password"); // tolerate older clients
        }

        if (newPassword == null || newPassword.length() < 6) {
            response.put("success", false);
            response.put("message", "New password must be at least 6 characters");
            return ResponseEntity.badRequest().body(response);
        }

        // Require current password verification when provided.
        if (currentPassword != null && !currentPassword.isEmpty()) {
            boolean ok = userService.verifyPassword(authUser.getUserId(), currentPassword);
            if (!ok) {
                response.put("success", false);
                response.put("message", "Current password is incorrect");
                return ResponseEntity.status(403).body(response);
            }
        }

        return userService.updatePassword(authUser.getUserId(), newPassword)
                .map(user -> {
                    auditService.log("USER_PASSWORD_CHANGED", "User",
                            authUser.getUserId(), authUser.getUserId(), null, null);
                    response.put("success", true);
                    response.put("message", "Password updated successfully");
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "User not found");
                    return ResponseEntity.status(404).body(response);
                });
    }

    // ─────────────────────────────────────────────────────────────────────
    // User approval workflow — used by superadmin/approvals UI
    // ─────────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<Map<String, Object>> approveUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser approver) {
        Map<String, Object> response = new HashMap<>();
        UUID approverId = approver != null ? approver.getUserId() : null;
        Optional<UserDTO> target = userService.getUserById(id);
        if (target.isEmpty()) {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(404).body(response);
        }
        accessGuard.assertMayMutateUserByCenter(target.get().getCenterId());
        return userService.setApprovalStatus(id, "APPROVED", approverId, null)
                .map(user -> {
                    auditService.log("USER_APPROVED", "User", id, approverId, null,
                            "{\"approval_status\":\"APPROVED\"}");
                    response.put("success", true);
                    response.put("message", "User approved");
                    response.put("data", user);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "User not found");
                    return ResponseEntity.status(404).body(response);
                });
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<Map<String, Object>> rejectUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser approver,
            @RequestBody(required = false) Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();
        String reason = body != null ? body.get("reason") : null;
        UUID approverId = approver != null ? approver.getUserId() : null;
        Optional<UserDTO> target = userService.getUserById(id);
        if (target.isEmpty()) {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(404).body(response);
        }
        accessGuard.assertMayMutateUserByCenter(target.get().getCenterId());
        return userService.setApprovalStatus(id, "REJECTED", approverId, reason)
                .map(user -> {
                    String newJson = "{\"approval_status\":\"REJECTED\"" +
                            (reason != null ? ",\"reason\":\"" + reason.replace("\"", "\\\"") + "\"" : "") + "}";
                    auditService.log("USER_REJECTED", "User", id, approverId, null, newJson);
                    response.put("success", true);
                    response.put("message", "User rejected");
                    response.put("data", user);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "User not found");
                    return ResponseEntity.status(404).body(response);
                });
    }
}
