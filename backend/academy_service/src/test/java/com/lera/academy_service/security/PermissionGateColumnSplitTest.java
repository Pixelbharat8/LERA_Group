package com.lera.academy_service.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Two switches on the Chairman's Feature Management screen did nothing here. /api/courses
 * reported classes_access, so "Courses" was inert while "Classes" silently governed courses;
 * /api/reports and /api/report-cards reported no column at all, so "Reports" was inert outright.
 *
 * The fix had a trap. The per-user column used to be derived from the same baseModule() that
 * produces the granular role code, and role_permissions seeds no courses.* or reports.* code —
 * so splitting the column out of a shared mapping would have started demanding a role code that
 * does not exist and denied every caller. The two mappings are now separate, and the tests below
 * pin BOTH halves: the new columns, and the role codes staying exactly as they were.
 */
class PermissionGateColumnSplitTest {

    private final PermissionGateFilter filter = new PermissionGateFilter(null);

    @Test
    void coursesAndReportsNowAnswerToTheirOwnToggles() {
        assertEquals("courses_access", filter.userPermissionColumn("/api/courses"));
        assertEquals("courses_access", filter.userPermissionColumn("/api/courses/7"));
        assertEquals("reports_access", filter.userPermissionColumn("/api/reports"));
        assertEquals("reports_access", filter.userPermissionColumn("/api/report-cards/3"));
    }

    @Test
    void theOtherModulesKeepTheColumnsTheyAlreadyHad() {
        assertEquals("classes_access", filter.userPermissionColumn("/api/classes"));
        assertEquals("students_access", filter.userPermissionColumn("/api/students"));
        assertEquals("students_access", filter.userPermissionColumn("/api/enrollments"));
        assertEquals("teachers_access", filter.userPermissionColumn("/api/teachers"));
    }

    @Test
    void theRoleCodesAreUnchangedBySplittingTheColumns() {
        // If these became "courses.view"/"courses.create" the role layer would look for a code
        // role_permissions has never seeded, and deny every non-god-mode caller.
        assertEquals("classes.view", filter.requiredPermission("GET", "/api/courses"));
        assertEquals("classes.create", filter.requiredPermission("POST", "/api/courses"));
        assertEquals("classes", filter.baseModule("/api/courses"));
    }

    @Test
    void reportsCarryNoRoleCodeSoOnlyTheChairmanToggleGovernsThem() {
        // No seeded reports.* code is demanded — the per-user column is the whole decision.
        assertNull(filter.requiredPermission("GET", "/api/reports"));
        assertNull(filter.baseModule("/api/reports"));
    }

    @Test
    void unrelatedAcademyPathsStayUngated() {
        assertNull(filter.userPermissionColumn("/api/exams"));
        assertNull(filter.userPermissionColumn("/api/library"));
        assertNull(filter.userPermissionColumn("/api/coursework"));
    }
}
