package com.lera.payment_service.security;

import com.lera.payment_service.entity.Payment;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentAccessService {

    private final JdbcTemplate jdbcTemplate;

    private static final Set<String> PRIVILEGED_STAFF_ROLES = Set.of(
            "SUPER_ADMIN", "CHAIRMAN", "CEO", "DIRECTOR", "CENTER_MANAGER", "ACCOUNTANT");

    private static final Set<String> ORG_WIDE = Set.of(
            "SUPER_ADMIN", "CHAIRMAN", "CEO", "DIRECTOR");

    public boolean isPrivilegedStaff(String roleName) {
        if (roleName == null) {
            return false;
        }
        return PRIVILEGED_STAFF_ROLES.contains(roleName.toUpperCase());
    }

    public boolean isOrgWide(String roleName) {
        if (roleName == null) {
            return false;
        }
        return ORG_WIDE.contains(roleName.toUpperCase());
    }

    public boolean isParentOfStudent(UUID parentUserId, UUID studentId) {
        if (parentUserId == null || studentId == null) {
            return false;
        }
        Long c = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM student_parents WHERE student_id = ? AND parent_id = ?",
                Long.class, studentId, parentUserId);
        return c != null && c > 0;
    }

    public Optional<UUID> findStudentIdForUser(UUID userId) {
        if (userId == null) {
            return Optional.empty();
        }
        try {
            UUID id = jdbcTemplate.queryForObject(
                    "SELECT id FROM students WHERE user_id = ? LIMIT 1",
                    UUID.class, userId);
            return Optional.ofNullable(id);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public boolean canViewStudentEntity(AuthUser user, UUID studentId) {
        if (user == null || studentId == null) {
            return false;
        }
        if (isPrivilegedStaff(user.getRoleName())) {
            return true;
        }
        String role = user.getRoleName();
        if (role == null) {
            return false;
        }
        if ("PARENT".equalsIgnoreCase(role)) {
            return isParentOfStudent(user.getUserId(), studentId);
        }
        if ("STUDENT".equalsIgnoreCase(role)) {
            return findStudentIdForUser(user.getUserId())
                    .map(sid -> sid.equals(studentId))
                    .orElse(false);
        }
        return false;
    }

    public void assertCanViewStudentEntity(AuthUser user, UUID studentId) {
        if (!canViewStudentEntity(user, studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    public void assertPrivilegedStaff(AuthUser user) {
        if (user == null || !isPrivilegedStaff(user.getRoleName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    public boolean canViewPaymentId(AuthUser user, UUID paymentId) {
        if (user == null || paymentId == null) {
            return false;
        }
        try {
            var row = jdbcTemplate.queryForMap(
                    "SELECT student_id, center_id FROM payments WHERE id = ?", paymentId);
            Payment p = new Payment();
            p.setStudentId((UUID) row.get("student_id"));
            p.setCenterId((UUID) row.get("center_id"));
            return canViewPayment(user, p);
        } catch (EmptyResultDataAccessException e) {
            return false;
        }
    }

    public boolean canViewPayment(AuthUser user, Payment payment) {
        if (user == null || payment == null || payment.getStudentId() == null) {
            return false;
        }
        if (isPrivilegedStaff(user.getRoleName())) {
            if (isOrgWide(user.getRoleName())) {
                return true;
            }
            UUID jwtCenter = user.getCenterId();
            // A non-org-wide privileged user must have a centre and it must match the
            // payment's centre. Previously a null centre returned true, letting a
            // centre-scoped user view payments from ANY centre.
            return jwtCenter != null && Objects.equals(jwtCenter, payment.getCenterId());
        }
        String role = user.getRoleName();
        if (role == null) {
            return false;
        }
        if ("PARENT".equalsIgnoreCase(role)) {
            return isParentOfStudent(user.getUserId(), payment.getStudentId());
        }
        if ("STUDENT".equalsIgnoreCase(role)) {
            return findStudentIdForUser(user.getUserId())
                    .map(sid -> sid.equals(payment.getStudentId()))
                    .orElse(false);
        }
        return false;
    }

    public UUID effectiveCenterId(AuthUser user, UUID requestedCenterId) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (isOrgWide(user.getRoleName())) {
            return requestedCenterId;
        }
        if (!isPrivilegedStaff(user.getRoleName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        UUID jwtCenter = user.getCenterId();
        if (jwtCenter == null) {
            if (requestedCenterId != null) {
                return requestedCenterId;
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "centerId is required");
        }
        if (requestedCenterId != null && !Objects.equals(requestedCenterId, jwtCenter)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another center's payments");
        }
        return jwtCenter;
    }
}
