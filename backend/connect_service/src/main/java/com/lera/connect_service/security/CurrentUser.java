package com.lera.connect_service.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Convenience accessor for the currently-authenticated user.
 *
 * <p>The {@code AuthUser} stuffed into the security context by
 * {@link JwtAuthenticationFilter} is the canonical identity. Controllers must
 * use this helper instead of trusting client-supplied IDs (e.g. {@code userId}
 * in a request body) because the JWT is signed and the body is not.
 */
public final class CurrentUser {

    private static final Set<String> STAFF_ROLES = Set.of(
            "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR",
            "CENTER_ADMIN", "CENTER_MANAGER", "ACADEMIC_MANAGER", "TEACHER", "STAFF"
    );

    private CurrentUser() {}

    public static Optional<AuthUser> get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return Optional.empty();
        Object principal = auth.getPrincipal();
        if (principal instanceof AuthUser u) return Optional.of(u);
        return Optional.empty();
    }

    public static Optional<UUID> id() {
        return get().map(AuthUser::getUserId);
    }

    public static String role() {
        return get().map(AuthUser::getRoleName).orElse(null);
    }

    public static boolean isStaff() {
        String r = role();
        return r != null && STAFF_ROLES.contains(r.toUpperCase());
    }

    public static boolean isSelfOrStaff(UUID userId) {
        if (userId == null) return false;
        if (isStaff()) return true;
        return id().map(userId::equals).orElse(false);
    }
}
