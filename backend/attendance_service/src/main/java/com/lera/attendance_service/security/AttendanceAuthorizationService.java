package com.lera.attendance_service.security;

import com.lera.attendance_service.entity.AttendanceException;
import com.lera.attendance_service.entity.AttendanceRecord;
import com.lera.attendance_service.entity.LeaveBalanceAccrual;
import com.lera.attendance_service.entity.TeacherStaffLeave;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Binds leave APIs to JWT {@code centerId} so center-scoped roles cannot read or mutate
 * another center's leave rows (IDOR).
 */
@Service
public class AttendanceAuthorizationService {

    /**
     * SpEL fragment for {@code @PreAuthorize} on center-wide leave reads — blocks student/parent
     * tokens from listing an entire center's leave rows (JWT center binding stays in
     * {@link #assertCenterAccess(AuthUser, UUID)}).
     */
    public static final String PRE_CENTER_LEAVE_READS =
            "hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN',"
                    + "'ACADEMIC_MANAGER','TEACHER','STAFF','TEACHING_ASSISTANT','TA')";

    /** Center staff listing of attendance exceptions — not student/parent global browse. */
    public static final String PRE_CENTER_ATTENDANCE_EXCEPTION_READS = PRE_CENTER_LEAVE_READS;

    private static final Set<String> ORG_WIDE = Set.of(
            "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR");

    /** May list or act on leave for users other than self within the same center as the JWT. */
    private static final Set<String> CENTER_LEAVE_MANAGEMENT = Set.of(
            "CENTER_MANAGER", "CENTER_ADMIN", "ACADEMIC_MANAGER");

    private static final Set<String> JWT_CENTER_BIND = Set.of("CENTER_MANAGER", "CENTER_ADMIN");

    /** When no explicit center filter is passed, these roles may fall back to JWT {@code centerId}. */
    private static final Set<String> DEFAULT_CENTER_ATTENDANCE_ROLES = Set.of(
            "TEACHER", "STAFF", "TEACHING_ASSISTANT", "TA", "ACADEMIC_MANAGER",
            "CENTER_MANAGER", "CENTER_ADMIN");

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

    /**
     * Center-scoped roles must supply a center equal to JWT {@code centerId}; org-wide may use any center.
     */
    public void assertCenterAccess(AuthUser user, UUID centerId) {
        assertAuthenticated(user);
        if (centerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "centerId required");
        }
        if (isOrgWide(user)) {
            return;
        }
        UUID jwtCenter = user.getCenterId();
        if (jwtCenter == null || !Objects.equals(jwtCenter, centerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Center access denied");
        }
    }

    /** Org-wide roles skip center match; others must match {@code centerId}. */
    public void assertCenterAccessOrOrg(AuthUser user, UUID centerId) {
        assertAuthenticated(user);
        if (isOrgWide(user)) {
            return;
        }
        assertCenterAccess(user, centerId);
    }

    public void assertCanReadLeave(AuthUser user, TeacherStaffLeave leave) {
        if (leave == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        assertAuthenticated(user);
        if (isOrgWide(user)) {
            return;
        }
        if (user.getUserId() != null && user.getUserId().equals(leave.getUserId())) {
            return;
        }
        if (user.getUserId() != null && user.getUserId().equals(leave.getReportingManagerId())) {
            return;
        }
        if (user.getUserId() != null && user.getUserId().equals(leave.getAssignedApproverId())) {
            return;
        }
        if (user.getUserId() != null && user.getUserId().equals(leave.getCenterManagerId())) {
            return;
        }
        if (CENTER_LEAVE_MANAGEMENT.contains(safeRole(user))
                && user.getCenterId() != null
                && user.getCenterId().equals(leave.getCenterId())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view this leave");
    }

    /**
     * Non-self access to another user's leave list: org-wide or same-center management role only;
     * result rows are filtered to the caller's center when not org-wide.
     */
    public void assertCanQueryLeavesForUser(AuthUser user, UUID targetUserId) {
        assertAuthenticated(user);
        if (isOrgWide(user)) {
            return;
        }
        if (user.getUserId() != null && user.getUserId().equals(targetUserId)) {
            return;
        }
        if (!CENTER_LEAVE_MANAGEMENT.contains(safeRole(user)) || user.getCenterId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    public boolean leaveRowInCallerCenter(AuthUser user, TeacherStaffLeave leave) {
        return user.getCenterId() != null && leave.getCenterId() != null
                && user.getCenterId().equals(leave.getCenterId());
    }

    public void assertApplyLeaveCenter(AuthUser user, TeacherStaffLeave leave) {
        assertAuthenticated(user);
        if (leave == null || leave.getCenterId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "centerId required on leave");
        }
        if (isOrgWide(user)) {
            return;
        }
        if (CENTER_LEAVE_MANAGEMENT.contains(safeRole(user)) || user.getUserId().equals(leave.getUserId())) {
            if (user.getCenterId() == null || !user.getCenterId().equals(leave.getCenterId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Leave center must match your center");
            }
            return;
        }
        if (user.getUserId() != null && user.getUserId().equals(leave.getUserId())) {
            if (user.getCenterId() != null && !user.getCenterId().equals(leave.getCenterId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Leave center must match your center");
            }
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    public void assertReportingManagerOrOrg(AuthUser user, UUID managerId) {
        assertAuthenticated(user);
        if (isOrgWide(user)) {
            return;
        }
        if (user.getUserId() != null && user.getUserId().equals(managerId)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    public boolean isJwtCenterBindRole(AuthUser user) {
        return user != null && user.getRoleName() != null
                && JWT_CENTER_BIND.contains(user.getRoleName().toUpperCase());
    }

    /**
     * For attendance list queries: org-wide uses {@code requestedCenterId} as passed (may be null);
     * {@code CENTER_MANAGER}/{@code CENTER_ADMIN} must use JWT center and cannot query another center.
     */
    /**
     * Self-service attendance list: defaults to JWT user; org-wide may query another marker.
     */
    public UUID effectiveMarkedById(AuthUser user, UUID requestedMarkedBy) {
        assertAuthenticated(user);
        UUID self = requireUserId(user);
        if (requestedMarkedBy == null) {
            return self;
        }
        if (self.equals(requestedMarkedBy)) {
            return requestedMarkedBy;
        }
        if (isOrgWide(user)) {
            return requestedMarkedBy;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another user's attendance marks");
    }

    public UUID requireUserId(AuthUser user) {
        if (user == null || user.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return user.getUserId();
    }

    public UUID effectiveQueryCenterId(AuthUser user, UUID requestedCenterId) {
        assertAuthenticated(user);
        if (isOrgWide(user) || !isJwtCenterBindRole(user)) {
            return requestedCenterId;
        }
        UUID jwt = user.getCenterId();
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "JWT must include centerId for this role");
        }
        if (requestedCenterId != null && !Objects.equals(requestedCenterId, jwt)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another center's attendance");
        }
        return jwt;
    }

    /**
     * {@code /api/leave-requests} aggregate listing: org-wide may pass any {@code requestedCenterId}
     * or {@code null} for all centers; all other callers are restricted to JWT {@code centerId}.
     */
    public UUID effectiveLeaveRequestListCenterId(AuthUser user, UUID requestedCenterId) {
        assertAuthenticated(user);
        if (isOrgWide(user)) {
            return requestedCenterId;
        }
        UUID jwt = user.getCenterId();
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "JWT must include centerId for this operation");
        }
        if (requestedCenterId != null && !Objects.equals(requestedCenterId, jwt)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another center's leave data");
        }
        return jwt;
    }

    public boolean mayDefaultToJwtCenterAttendanceList(AuthUser user) {
        return user != null && user.getRoleName() != null
                && DEFAULT_CENTER_ATTENDANCE_ROLES.contains(user.getRoleName().toUpperCase());
    }

    /** Ensures non–org-wide callers do not read attendance rows outside their JWT center (when set). */
    public void assertAttendanceRecordsForCaller(AuthUser user, List<AttendanceRecord> rows) {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        assertAuthenticated(user);
        if (isOrgWide(user)) {
            return;
        }
        UUID jwt = user.getCenterId();
        if (jwt != null) {
            for (AttendanceRecord r : rows) {
                if (r.getCenterId() != null && !jwt.equals(r.getCenterId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Attendance is outside your center");
                }
            }
            return;
        }
        String r = safeRole(user);
        if ("STUDENT".equals(r) || "PARENT".equals(r)) {
            return;
        }
        if (DEFAULT_CENTER_ATTENDANCE_ROLES.contains(r)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "JWT must include centerId for this role");
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    public void assertAttendanceRecord(AuthUser user, AttendanceRecord record) {
        if (record == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        assertAttendanceRecordsForCaller(user, List.of(record));
    }

    public void assertAttendanceExceptionsForCaller(AuthUser user, List<AttendanceException> rows) {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        assertAuthenticated(user);
        if (isOrgWide(user)) {
            return;
        }
        UUID jwt = user.getCenterId();
        if (jwt != null) {
            for (AttendanceException row : rows) {
                if (row.getCenterId() != null && !jwt.equals(row.getCenterId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Exception is outside your center");
                }
            }
            return;
        }
        String r = safeRole(user);
        if ("STUDENT".equals(r) || "PARENT".equals(r)) {
            return;
        }
        if (DEFAULT_CENTER_ATTENDANCE_ROLES.contains(r)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "JWT must include centerId for this role");
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    public void assertAttendanceException(AuthUser user, AttendanceException row) {
        if (row == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        assertAttendanceExceptionsForCaller(user, List.of(row));
    }

    public void assertCanMutateAttendanceException(AuthUser user, AttendanceException row) {
        assertAuthenticated(user);
        if (row == null || row.getCenterId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "centerId required on attendance exception");
        }
        if (isOrgWide(user)) {
            return;
        }
        if (DEFAULT_CENTER_ATTENDANCE_ROLES.contains(safeRole(user))) {
            assertCenterAccess(user, row.getCenterId());
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot modify attendance exceptions");
    }

    /** Self, org-wide, or same-center leave management may read a user's leave balance. */
    public void assertCanQueryLeaveBalance(AuthUser user, UUID targetUserId) {
        assertAuthenticated(user);
        if (targetUserId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }
        if (isOrgWide(user)) {
            return;
        }
        if (user.getUserId() != null && user.getUserId().equals(targetUserId)) {
            return;
        }
        assertCanQueryLeavesForUser(user, targetUserId);
    }

    public void assertCanAccessAccrual(AuthUser user, LeaveBalanceAccrual accrual) {
        if (accrual == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        assertCanQueryLeaveBalance(user, accrual.getUserId());
        if (isOrgWide(user)) {
            return;
        }
        UUID jwtCenter = user.getCenterId();
        if (jwtCenter != null && accrual.getCenterId() != null && !jwtCenter.equals(accrual.getCenterId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accrual is outside your center");
        }
    }

    private static String safeRole(AuthUser user) {
        return user.getRoleName() == null ? "" : user.getRoleName().toUpperCase();
    }
}
