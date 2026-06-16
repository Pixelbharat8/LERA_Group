package com.lera.payment_service.security;

import com.lera.payment_service.entity.Invoice;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Authorizes invoice reads for parent/student portals. Listing used to allow any authenticated user
 * to hit {@code /api/invoices} without filters — this service scopes queries by JWT role.
 */
@Service
@RequiredArgsConstructor
public class InvoiceAccessService {

    private final JdbcTemplate jdbcTemplate;

    private static final Set<String> PRIVILEGED_STAFF_ROLES = Set.of(
            "SUPER_ADMIN", "CHAIRMAN", "CEO", "DIRECTOR", "CENTER_MANAGER", "ACCOUNTANT");

    public boolean isPrivilegedStaff(String roleName) {
        if (roleName == null) {
            return false;
        }
        return PRIVILEGED_STAFF_ROLES.contains(roleName.toUpperCase());
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

    public boolean canViewInvoice(AuthUser user, Invoice inv) {
        if (user == null || inv == null) {
            return false;
        }
        if (isPrivilegedStaff(user.getRoleName())) {
            return true;
        }
        String role = user.getRoleName();
        if (role == null) {
            return false;
        }
        if (inv.getStudentId() == null) {
            return false;
        }
        if ("PARENT".equalsIgnoreCase(role)) {
            return isParentOfStudent(user.getUserId(), inv.getStudentId());
        }
        if ("STUDENT".equalsIgnoreCase(role)) {
            return findStudentIdForUser(user.getUserId())
                    .map(sid -> sid.equals(inv.getStudentId()))
                    .orElse(false);
        }
        return false;
    }
}
