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

    /**
     * STAFF plus STUDENT — for endpoints a student legitimately uses for their OWN work,
     * e.g. uploading and submitting assignments. Keep this narrow; most operational APIs
     * must stay {@link #STAFF}-only.
     */
    public static final String STAFF_OR_STUDENT =
            "hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','TEACHING_ASSISTANT','TA','STAFF','STUDENT')";

    /**
     * Management-only operations that a rank-and-file TEACHER/TA must NOT perform — e.g. issuing or
     * revoking certificates. Org-wide execs + centre managers/admins only.
     */
    public static final String MANAGERS =
            "hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')";
}
