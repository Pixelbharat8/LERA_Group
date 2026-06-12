package com.lera.identity_service.security;

import com.lera.identity_service.dto.UserDTO;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public final class SecurityUtils {
    private SecurityUtils() {}

    /** Roles that may access any center without JWT centerId matching. */
    private static final Set<String> ORG_WIDE_ROLES = Set.of(
            "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR");

    /** May list/search users or open user profiles within their JWT center (not org-wide). */
    private static final Set<String> CENTER_DIRECTORY_ROLES = Set.of(
            "CENTER_MANAGER", "CENTER_ADMIN", "ACADEMIC_MANAGER", "TEACHER", "STAFF",
            "TEACHING_ASSISTANT", "TA");

    public static Optional<AuthUser> currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return Optional.empty();
        Object principal = auth.getPrincipal();
        if (principal instanceof AuthUser au) return Optional.of(au);
        return Optional.empty();
    }

    public static AuthUser requireUser() {
        return currentUser().orElseThrow(() -> new IllegalStateException("Unauthenticated"));
    }

    public static boolean isSuperAdmin(AuthUser user) {
        return user != null && "SUPER_ADMIN".equalsIgnoreCase(user.getRoleName());
    }

    public static boolean isOrgWide(AuthUser user) {
        if (user == null || user.getRoleName() == null) {
            return false;
        }
        return ORG_WIDE_ROLES.contains(user.getRoleName().toUpperCase());
    }

    public static boolean isCenterDirectoryRole(AuthUser user) {
        if (user == null || user.getRoleName() == null) {
            return false;
        }
        return CENTER_DIRECTORY_ROLES.contains(user.getRoleName().toUpperCase());
    }

    /**
     * Whether the viewer may read another user's profile (not {@code viewer == target}).
     * Org-wide roles: yes. Same-center staff/teachers: yes. Others: no.
     */
    public static boolean canViewOtherUserProfile(AuthUser viewer, UserDTO target) {
        if (viewer == null || target == null || target.getId() == null) {
            return false;
        }
        if (viewer.getUserId() != null && viewer.getUserId().equals(target.getId())) {
            return true;
        }
        if (isOrgWide(viewer)) {
            return true;
        }
        if (!isCenterDirectoryRole(viewer)) {
            return false;
        }
        UUID vc = viewer.getCenterId();
        UUID tc = target.getCenterId();
        return vc != null && vc.equals(tc);
    }
}
