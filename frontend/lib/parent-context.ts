import { apiFetch } from "./api";
import { getAuthUserIdFromCookie } from "./auth-context";

export { getAuthUserIdFromCookie };
import { computeAttendanceRate, loadMySessionAttendance } from "./student-context";

export { loadMySessionAttendance };

export type ParentProfileRow = {
  id: string;
  userId: string;
  occupation?: string;
  company?: string;
};

export type ParentChildRow = {
  id: string;
  fullname?: string;
  studentCode?: string;
  centerId?: string;
  centerName?: string;
  status?: string;
  avatarUrl?: string;
  className?: string;
};

export async function resolveMyParentProfile(): Promise<ParentProfileRow | null> {
  try {
    return (await apiFetch("/api/parents/me")) as ParentProfileRow;
  } catch {
    try {
      return (await apiFetch("/api/parents/self")) as ParentProfileRow;
    } catch {
      return null;
    }
  }
}

export async function resolveMyParentUserId(): Promise<string | null> {
  const profile = await resolveMyParentProfile();
  if (profile?.userId) return String(profile.userId);
  return getAuthUserIdFromCookie();
}

/** Children linked to the logged-in parent (scoped, no global student list). */
export async function loadMyChildren(): Promise<ParentChildRow[]> {
  const userId = await resolveMyParentUserId();
  if (!userId) return [];
  const data = await apiFetch(`/api/parents/${userId}/children`).catch(() => []);
  const base = Array.isArray(data) ? (data as ParentChildRow[]) : [];
  return Promise.all(
    base.map(async (child) => {
      const student = (await apiFetch(`/api/students/${child.id}`).catch(() => null)) as {
        centerId?: string;
      } | null;
      const centerId = student?.centerId ? String(student.centerId) : child.centerId;
      let centerName = child.centerName;
      if (centerId && !centerName) {
        const center = (await apiFetch(`/api/centers/${centerId}`).catch(() => null)) as {
          name?: string;
        } | null;
        centerName = center?.name;
      }
      const history = (await apiFetch(`/api/students/${child.id}/class-history`).catch(() => [])) as {
        className?: string;
      }[];
      const className =
        child.className ||
        (Array.isArray(history) && history.length > 0 ? history[0].className : undefined);
      return { ...child, centerId, centerName, className };
    })
  );
}

export type ChildTeacherContact = {
  id: string;
  fullname: string;
  email: string;
  phone?: string;
  className?: string;
};

/** Lead teachers for classes the child is enrolled in (auth user ids for messaging). */
export async function loadTeachersForChild(studentId: string): Promise<ChildTeacherContact[]> {
  const enrollments = (await apiFetch(`/api/enrollments?studentId=${studentId}`).catch(() => [])) as {
    classId?: string;
  }[];
  if (!Array.isArray(enrollments)) return [];

  const byUserId = new Map<string, ChildTeacherContact>();
  for (const e of enrollments) {
    if (!e.classId) continue;
    const cls = (await apiFetch(`/api/classes/${e.classId}`).catch(() => null)) as {
      name?: string;
      teacherId?: string;
    } | null;
    if (!cls?.teacherId) continue;
    try {
      const teacher = (await apiFetch(`/api/teachers/${cls.teacherId}`)) as {
        userId?: string;
      };
      if (!teacher?.userId) continue;
      const user = (await apiFetch(`/api/users/${teacher.userId}`).catch(() => null)) as {
        fullname?: string;
        name?: string;
        email?: string;
        phone?: string;
      } | null;
      if (!user) continue;
      byUserId.set(String(teacher.userId), {
        id: String(teacher.userId),
        fullname: user.fullname || user.name || user.email?.split("@")[0] || "Teacher",
        email: user.email || "",
        phone: user.phone,
        className: cls.name,
      });
    } catch {
      /* skip inaccessible teacher profile */
    }
  }
  return Array.from(byUserId.values());
}

export async function computeMyChildrenAvgAttendance(): Promise<number> {
  const children = await loadMyChildren();
  if (children.length === 0) return 0;
  const rates = await Promise.all(children.map((c) => computeAttendanceRate(c.id)));
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
}
