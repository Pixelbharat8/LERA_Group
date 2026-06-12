package com.lera.identity_service.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;
import java.util.UUID;

@Component
public class AccessGuard {

    public void assertCenterAccess(UUID requestedCenterId) {
        if (requestedCenterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "centerId required");
        }
        AuthUser user = SecurityUtils.requireUser();
        if (SecurityUtils.isOrgWide(user)) {
            return;
        }

        UUID userCenterId = user.getCenterId();
        if (userCenterId == null || !Objects.equals(userCenterId, requestedCenterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: center access denied");
        }
    }

    public void assertSuperAdmin() {
        AuthUser user = SecurityUtils.requireUser();
        if (!SecurityUtils.isSuperAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SUPER_ADMIN required");
        }
    }

    /**
     * Mutations on an existing user (update, approve, password reset by admin, etc.): org-wide
     * may touch any center; center-scoped staff only users assigned to their JWT center.
     */
    public void assertMayMutateUserByCenter(UUID targetUserCenterId) {
        AuthUser actor = SecurityUtils.requireUser();
        if (SecurityUtils.isOrgWide(actor)) {
            return;
        }
        if (targetUserCenterId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot modify users without a center assignment");
        }
        assertCenterAccess(targetUserCenterId);
    }
}
