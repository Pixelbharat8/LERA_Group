package com.lera.social_media_service.security;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.UUID;

public final class SocialMediaSecurity {

    private static final Set<String> ORG_WIDE_ROLES = Set.of(
            "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR");

    private SocialMediaSecurity() {}

    public static boolean isOrgWide(AuthUser user) {
        if (user == null || user.getRoleName() == null) {
            return false;
        }
        return ORG_WIDE_ROLES.contains(user.getRoleName().toUpperCase());
    }

    public static UUID requireUserId(AuthUser user) {
        if (user == null || user.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return user.getUserId();
    }

    public static void assertOrgWideMutate(AuthUser user) {
        if (!isOrgWide(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Creating or changing org-wide marketing resources requires an org-wide role");
        }
    }
}
