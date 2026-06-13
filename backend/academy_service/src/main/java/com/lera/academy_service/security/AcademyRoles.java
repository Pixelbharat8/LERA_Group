package com.lera.academy_service.security;

/**
 * Shared {@code @PreAuthorize} SpEL fragments — use as
 * {@code @PreAuthorize(AcademyRoles.STAFF)} so operational APIs are not exposed to
 * arbitrary authenticated student/parent tokens by default.
 *
 * <p>Role names here must stay aligned with {@link CurrentUser#isStaff()} (same allow-list).
 */
public final class AcademyRoles {

    private AcademyRoles() {}

    /** Day-to-day operations: teachers, centre staff, executives — not students/parents. */
    public static final String STAFF =
            "hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','TEACHING_ASSISTANT','TA','STAFF')";
}
