import { apiFetch } from "./api";

export type TeacherRow = {
  id: string;
  userId?: string;
  centerId?: string;
  teacherCode?: string;
};

/** Resolves {@code teachers.id} for the logged-in teacher/TA (JWT user). */
export async function resolveMyTeacherId(): Promise<string | null> {
  try {
    const me = (await apiFetch("/api/teachers/me")) as TeacherRow | null;
    return me?.id ?? null;
  } catch {
    return null;
  }
}

export function formatClassSchedule(c: {
  scheduleDays?: string;
  scheduleTimeStart?: string;
  scheduleTimeEnd?: string;
  schedule?: string;
}): string {
  if (c.schedule) return c.schedule;
  const days = c.scheduleDays || "";
  const start = c.scheduleTimeStart ? String(c.scheduleTimeStart).slice(0, 5) : "";
  const end = c.scheduleTimeEnd ? String(c.scheduleTimeEnd).slice(0, 5) : "";
  if (days && start && end) return `${days} ${start}–${end}`;
  if (days) return days;
  return "Schedule TBD";
}

export function isClassActive(status: string): boolean {
  return status === "OPEN" || status === "ACTIVE";
}

export async function loadScopedClasses(
  scope: "teacher" | "ta",
  entityId: string
): Promise<ReturnType<typeof mapClassFromApi>[]> {
  const param = scope === "teacher" ? `teacherId=${entityId}` : `taId=${entityId}`;
  const [classesRaw, programsRaw] = await Promise.all([
    apiFetch(`/api/classes?${param}`).catch(() => []),
    apiFetch("/api/programs/active").catch(() => []),
  ]);
  const classesArr = Array.isArray(classesRaw) ? classesRaw : [];
  const programsArr = Array.isArray(programsRaw) ? programsRaw : [];
  const programById = new Map(
    programsArr.map((p: { id: string; name?: string; programName?: string }) => [
      String(p.id),
      p.name || p.programName || "",
    ])
  );

  return Promise.all(
    classesArr.map(async (c: Record<string, unknown>) => {
      const enrollments = (await apiFetch(`/api/enrollments?classId=${c.id}`).catch(() => [])) as {
        studentId?: string;
      }[];
      const count = Array.isArray(enrollments) ? enrollments.length : 0;
      return mapClassFromApi(c, {
        enrollmentCount: count,
        programName: programById.get(String(c.programId)) || "",
      });
    })
  );
}

export type ClassSessionRow = {
  id: string;
  classId?: string;
  sessionDate: string;
  startTime?: string;
  endTime?: string;
  topic?: string;
  status: string;
  teacherId?: string;
};

export async function ensureClassSession(
  classId: string,
  sessionDate: string,
  teacherId?: string
): Promise<ClassSessionRow> {
  const existing = await apiFetch(`/api/class-sessions/class/${classId}/date/${sessionDate}`).catch(
    () => []
  );
  const list = Array.isArray(existing) ? (existing as ClassSessionRow[]) : [];
  if (list.length > 0) return list[0];

  const created = (await apiFetch("/api/class-sessions", {
    method: "POST",
    body: JSON.stringify({
      classId,
      sessionDate,
      startTime: "09:00:00",
      endTime: "10:30:00",
      topic: `Session ${sessionDate}`,
      status: "SCHEDULED",
      teacherId: teacherId || undefined,
    }),
  })) as ClassSessionRow;
  return created;
}

export async function loadSessionAttendanceMarks(
  sessionId: string,
  studentIds: string[]
): Promise<Record<string, string>> {
  const marks: Record<string, string> = {};
  for (const id of studentIds) {
    marks[id] = "PRESENT";
  }
  const existing = (await apiFetch(`/api/session-attendance/session/${sessionId}`).catch(
    () => []
  )) as { studentId?: string; status?: string }[];
  if (Array.isArray(existing)) {
    for (const row of existing) {
      if (row.studentId) {
        marks[row.studentId] = row.status || "PRESENT";
      }
    }
  }
  return marks;
}

export async function saveSessionAttendance(
  session: ClassSessionRow,
  classId: string,
  records: { studentId: string; status: string }[],
  markComplete: boolean
): Promise<void> {
  const payload = records.map((r) => ({
    sessionId: session.id,
    studentId: r.studentId,
    status: r.status,
  }));
  await apiFetch("/api/session-attendance/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (markComplete) {
    await apiFetch(`/api/class-sessions/${session.id}`, {
      method: "PUT",
      body: JSON.stringify({
        classId,
        sessionDate: session.sessionDate,
        startTime: session.startTime || "09:00:00",
        endTime: session.endTime || "10:30:00",
        topic: session.topic || "Class session",
        status: "COMPLETED",
      }),
    });
  }
}

export async function countStudentsInClasses(classIds: string[]): Promise<number> {
  if (classIds.length === 0) return 0;
  const counts = await Promise.all(
    classIds.map(async (id) => {
      const enrollments = (await apiFetch(`/api/enrollments?classId=${id}`).catch(() => [])) as unknown[];
      return Array.isArray(enrollments) ? enrollments.length : 0;
    })
  );
  return counts.reduce((a, b) => a + b, 0);
}

export async function countTodaySessionsForClasses(classIds: string[]): Promise<number> {
  if (classIds.length === 0) return 0;
  const today = new Date().toISOString().split("T")[0];
  const lists = await Promise.all(
    classIds.map((id) =>
      apiFetch(`/api/class-sessions?classId=${id}`).catch(() => [])
    )
  );
  return lists
    .flat()
    .filter((s): s is { sessionDate?: string } => !!s && typeof s === "object")
    .filter((s) => String(s.sessionDate || "").startsWith(today)).length;
}

export type RosterStudent = {
  id: string;
  fullname: string;
  studentCode: string;
  email: string;
  phone: string;
  status: string;
  classId: string;
  className: string;
};

/** Unique students enrolled across the given classes (for teacher/TA roster views). */
export async function loadRosterStudentsForClasses(
  classes: { id: string; className: string }[]
): Promise<RosterStudent[]> {
  const byId = new Map<string, RosterStudent>();
  for (const cls of classes) {
    const enrollments = (await apiFetch(`/api/enrollments?classId=${cls.id}`).catch(() => [])) as {
      studentId?: string;
    }[];
    if (!Array.isArray(enrollments)) continue;
    for (const e of enrollments) {
      const sid = e.studentId ? String(e.studentId) : "";
      if (!sid || byId.has(sid)) continue;
      const s = (await apiFetch(`/api/students/${sid}`).catch(() => null)) as Record<
        string,
        unknown
      > | null;
      if (!s?.id) continue;
      byId.set(sid, {
        id: String(s.id),
        fullname: String(s.fullname ?? s.fullName ?? "Unknown"),
        studentCode: String(s.studentCode ?? s.student_code ?? ""),
        email: String(s.email ?? ""),
        phone: String(s.phone ?? ""),
        status: String(s.status ?? "ACTIVE"),
        classId: cls.id,
        className: cls.className,
      });
    }
  }
  return Array.from(byId.values());
}

export function mapClassFromApi(
  c: Record<string, unknown>,
  options?: { enrollmentCount?: number; programName?: string; teacherName?: string }
) {
  return {
    id: String(c.id),
    name: String(c.name ?? ""),
    className: String(c.name ?? ""),
    programId: c.programId ? String(c.programId) : "",
    programName: options?.programName || String(c.programName ?? ""),
    teacherId: c.teacherId ? String(c.teacherId) : "",
    assistantTeacherId: c.assistantTeacherId ? String(c.assistantTeacherId) : "",
    teacherName: options?.teacherName || "",
    schedule: formatClassSchedule(c as Parameters<typeof formatClassSchedule>[0]),
    room: c.room ? String(c.room) : "",
    startDate: c.startDate ? String(c.startDate) : "",
    endDate: c.endDate ? String(c.endDate) : "",
    capacity: Number(c.maxStudents ?? c.capacity ?? 15),
    enrolledCount: options?.enrollmentCount ?? Number(c.currentEnrollment ?? c.enrolledCount ?? 0),
    status: String(c.status ?? "OPEN"),
    scheduleTimeStart: c.scheduleTimeStart,
    scheduleTimeEnd: c.scheduleTimeEnd,
    scheduleDays: c.scheduleDays,
  };
}
