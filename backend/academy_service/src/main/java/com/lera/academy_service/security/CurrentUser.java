package com.lera.academy_service.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Convenience accessor for the currently-authenticated user.
 *
 * <p>Controllers should treat the returned {@link AuthUser} as the source of
 * truth for {@code userId} and {@code centerId} — anything in a request body
 * with the same name is potentially attacker-controlled and must NOT be
 * trusted. Most controllers in this service only sanity-check the role with
 * {@code @PreAuthorize}; the JWT-derived identity here closes the gap where
 * a request body claims {@code parentId=<someone-else>}.
 */
public final class CurrentUser {

    /** Same role set as {@link AcademyRoles#STAFF} — update both when product adds a staff role. */
    private static final Set<String> STAFF_ROLES = Set.of(
            "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR",
            "CENTER_ADMIN", "CENTER_MANAGER", "ACADEMIC_MANAGER", "TEACHER",
            "TEACHING_ASSISTANT", "TA", "STAFF"
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

    /** True when the caller has any of the staff-side roles. */
    public static boolean isStaff() {
        String r = role();
        return r != null && STAFF_ROLES.contains(r.toUpperCase());
    }

    /** True if caller is the given user OR a staff role that can act on others' behalf. */
    public static boolean isSelfOrStaff(UUID userId) {
        if (userId == null) return false;
        if (isStaff()) return true;
        return id().map(userId::equals).orElse(false);
    }
}
