package com.lera.identity_service.controller;

import com.lera.identity_service.entity.User;
import com.lera.identity_service.security.AccessGuard;
import com.lera.identity_service.security.AuthCookies;
import com.lera.identity_service.security.SecurityUtils;
import com.lera.identity_service.service.AuditService;
import com.lera.identity_service.service.JwtService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.Assert;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/impersonation")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class ImpersonationController {

    private final AccessGuard accessGuard;
    private final EntityManager entityManager;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final AuthCookies authCookies;

    @PostMapping("/token")
    public ResponseEntity<Map<String, Object>> issueImpersonationToken(@Valid @RequestBody ImpersonationRequest req,
                                                                       HttpServletResponse response) {
        accessGuard.assertSuperAdmin();
        Assert.notNull(req, "Request is required");
        Assert.hasText(req.getTargetUserId(), "targetUserId is required");
        return doImpersonate(UUID.fromString(req.getTargetUserId()), response);
    }

    /**
     * Convenience alias used by the chairman/users/[id] page:
     *   POST /api/impersonation/{targetUserId}
     * No body required — the path variable IS the target.
     */
    @PostMapping("/{targetUserId}")
    public ResponseEntity<Map<String, Object>> issueImpersonationTokenById(@PathVariable UUID targetUserId,
                                                                           HttpServletResponse response) {
        accessGuard.assertSuperAdmin();
        return doImpersonate(targetUserId, response);
    }

    private ResponseEntity<Map<String, Object>> doImpersonate(UUID targetUserId, HttpServletResponse response) {
        User target = entityManager.find(User.class, targetUserId);
        if (target == null) {
            throw new IllegalArgumentException("User not found");
        }

        UUID adminUuid = SecurityUtils.requireUser().getUserId();
        String adminId  = adminUuid.toString();
        // SECURITY AUDIT LOG — impersonation is a high-privilege operation
        log.warn("IMPERSONATION: Admin {} is impersonating user {} (role={})",
                adminId, targetUserId, target.getRole() != null ? target.getRole().getName() : "UNKNOWN");

        // Persist a queryable audit record. The "newValues" payload captures
        // the target so security can reconstruct who was impersonated when.
        String roleName = target.getRole() != null ? target.getRole().getName() : null;
        auditService.log("USER_IMPERSONATED", "User", targetUserId, adminUuid, null,
                String.format("{\"targetRole\":\"%s\",\"targetEmail\":\"%s\"}",
                        roleName == null ? "" : roleName,
                        target.getEmail() == null ? "" : target.getEmail()));

        Map<String, Object> extra = new HashMap<>();
        extra.put("impersonatedBy", adminId);
        extra.put("impersonation", true);

        String token = jwtService.generateToken(extra, target);

        // Set the access token as an HttpOnly cookie (same mechanism as login) so the
        // frontend no longer needs to write a JS-readable `token` cookie. The refresh
        // cookie is intentionally left untouched. Token is still returned in the body for
        // non-browser/bearer clients.
        authCookies.setAuthCookies(response, token, jwtService.getAccessTokenSeconds(), null, 0);

        Map<String, Object> res = new HashMap<>();
        res.put("token", token);
        res.put("targetUserId", target.getId());
        res.put("targetRole", target.getRole() != null ? target.getRole().getName() : null);
        res.put("targetCenterId", target.getCenterId());
        return ResponseEntity.ok(res);
    }

    @Data
    public static class ImpersonationRequest {
        private String targetUserId;
    }
}
