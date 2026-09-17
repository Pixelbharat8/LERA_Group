import { redirect } from "next/navigation";

/**
 * This was a third course-admin screen. Nothing linked to it — not the sidebar, not any
 * dashboard — and it had drifted away from the CourseProgram entity: it posted courseCode, fee
 * and status, where a course stores code, price and isActive, so saving a course through it lost
 * the code and the price and never changed the status.
 *
 * /dashboard/academy/courses is the same feature, is linked from the sidebar, and now maps the
 * entity correctly. Sending this URL there keeps any bookmark working without keeping a screen
 * that quietly discards what is typed into it.
 *
 * Kept as a redirect rather than deleted: it is one line to restore if this page turns out to be
 * wanted, and a redirect cannot lose anyone's work in the meantime.
 */
export default function SuperadminCoursesRedirect() {
  redirect("/dashboard/academy/courses");
}
