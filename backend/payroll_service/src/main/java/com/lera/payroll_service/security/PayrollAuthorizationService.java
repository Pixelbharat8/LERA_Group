package com.lera.payroll_service.security;

import com.lera.payroll_service.entity.PayrollRecord;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class PayrollAuthorizationService {

    private static final Set<String> ORG_WIDE = Set.of(
            "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR");

    private static final Set<String> PAYROLL_MANAGEMENT = Set.of(
            "CENTER_MANAGER", "CENTER_ADMIN", "ACCOUNTANT", "ACADEMIC_MANAGER");

    public boolean isOrgWide(AuthUser user) {
        if (user == null || user.getRoleName() == null) {
            return false;
        }
        return ORG_WIDE.contains(user.getRoleName().toUpperCase());
    }

    public void assertAuthenticated(AuthUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
    }

    public UUID requireUserId(AuthUser user) {
        assertAuthenticated(user);
        if (user.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return user.getUserId();
    }

    /**
     * Payroll rows store staff/teacher identity in {@code teacherId} (auth user id or entity id).
     */
    public UUID effectivePayrollSubjectId(AuthUser user, UUID requestedSubjectId) {
        UUID self = requireUserId(user);
        if (requestedSubjectId == null) {
            return self;
        }
        if (self.equals(requestedSubjectId)) {
            return requestedSubjectId;
        }
        if (isOrgWide(user) || PAYROLL_MANAGEMENT.contains(safeRole(user))) {
            return requestedSubjectId;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another user's payroll");
    }

    public UUID effectiveQueryCenterId(AuthUser user, UUID requestedCenterId) {
        assertAuthenticated(user);
        if (isOrgWide(user)) {
            return requestedCenterId;
        }
        UUID jwtCenter = user.getCenterId();
        if (jwtCenter == null) {
            if (requestedCenterId != null && PAYROLL_MANAGEMENT.contains(safeRole(user))) {
                return requestedCenterId;
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "JWT must include centerId for this operation");
        }
        if (requestedCenterId != null && !Objects.equals(requestedCenterId, jwtCenter)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another center's payroll");
        }
        return jwtCenter;
    }

    public void assertCanViewPayrollRecord(AuthUser user, PayrollRecord record) {
        if (record == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        assertAuthenticated(user);
        if (isOrgWide(user)) {
            return;
        }
        UUID self = user.getUserId();
        if (self != null && self.equals(record.getTeacherId())) {
            return;
        }
        if (PAYROLL_MANAGEMENT.contains(safeRole(user))
                && user.getCenterId() != null
                && record.getCenterId() != null
                && user.getCenterId().equals(record.getCenterId())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view this payroll record");
    }

    public void assertPayrollRecordsForCaller(AuthUser user, List<PayrollRecord> rows) {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        for (PayrollRecord r : rows) {
            assertCanViewPayrollRecord(user, r);
        }
    }

    public void assertPayrollManagement(AuthUser user) {
        assertAuthenticated(user);
        if (isOrgWide(user) || PAYROLL_MANAGEMENT.contains(safeRole(user))) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    private static String safeRole(AuthUser user) {
        return user.getRoleName() == null ? "" : user.getRoleName().toUpperCase();
    }
}
