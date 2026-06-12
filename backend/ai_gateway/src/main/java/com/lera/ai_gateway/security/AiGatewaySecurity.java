package com.lera.ai_gateway.security;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;
import java.util.Set;
import java.util.UUID;

public final class AiGatewaySecurity {

    private static final Set<String> ORG_WIDE = Set.of(
            "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR");

    private static final Set<String> ACADEMY_STAFF = Set.of(
            "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR",
            "CENTER_ADMIN", "CENTER_MANAGER", "ACADEMIC_MANAGER", "TEACHER",
            "TEACHING_ASSISTANT", "TA", "STAFF");

    private AiGatewaySecurity() {}

    public static boolean isOrgWide(AuthUser user) {
        if (user == null || user.getRoleName() == null) {
            return false;
        }
        return ORG_WIDE.contains(user.getRoleName().toUpperCase());
    }

    public static boolean isAcademyStaff(AuthUser user) {
        if (user == null || user.getRoleName() == null) {
            return false;
        }
        return isOrgWide(user) || ACADEMY_STAFF.contains(user.getRoleName().toUpperCase());
    }

    public static UUID requireUserId(AuthUser user) {
        if (user == null || user.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return user.getUserId();
    }

    public static UUID effectiveUserId(AuthUser user, UUID requestedUserId) {
        UUID self = requireUserId(user);
        if (requestedUserId == null) {
            return self;
        }
        if (Objects.equals(self, requestedUserId)) {
            return requestedUserId;
        }
        if (isOrgWide(user) || isAcademyStaff(user)) {
            return requestedUserId;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another user's data");
    }

    public static void assertOrgWide(AuthUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (!isOrgWide(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Org-wide role required");
        }
    }

    public static void assertStaff(AuthUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (!isAcademyStaff(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Staff role required");
        }
    }
}
