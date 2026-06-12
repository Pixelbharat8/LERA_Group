import { apiFetch } from "./api";
import { formatClassSchedule } from "./teacher-context";

export type StudentRow = {
  id: string;
  userId?: string;
  fullname?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  studentCode?: string;
  student_code?: string;
  centerId?: string;
  status?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  country?: string;
  enrollmentDate?: string;
  created_at?: string;
  emergencyContact?: string;
  emergency_contact?: string;
  emergencyPhone?: string;
  emergency_phone?: string;
  profileImage?: string;
  avatar?: string;
  center?: { name?: string };
  centerName?: string;
};

/** Resolves {@code students.id} for the logged-in student (JWT user). */
export async function resolveMyStudent(): Promise<StudentRow | null> {
  try {
    return (await apiFetch("/api/students/self")) as StudentRow;
  } catch {
    try {
      return (await apiFetch("/api/students/me")) as StudentRow;
    } catch {
      return null;
    }
  }
}

export async function resolveMyStudentId(): Promise<string | null> {
  const row = await resolveMyStudent();
  return row?.id ?? null;
}

export type ClassHistoryEntry = {
  id: string;
  classId: string;
  className?: string;
  classCode?: string;
  teacherId?: string;
  room?: string;
  status?: string;
  enrollmentDate?: string;
  startDate?: string;
  endDate?: string;
};

export async function loadMyClassHistory(studentId: string): Promise<ClassHistoryEntry[]> {
  const data = await apiFetch(`/api/students/${studentId}/class-history`).catch(() => []);
  return Array.isArray(data) ? (data as ClassHistoryEntry[]) : [];
}

export type StudentClassView = {
  id: string;
  className: string;
  courseName: string;
  teacherName: string;
  schedule: string;
  room: string;
  status: string;
  scheduleDays?: string;
  scheduleTimeStart?: string;
  scheduleTimeEnd?: string;
};

/** Enriched class list for student dashboards (history + class row). */
export async function loadMyClasses(studentId: string): Promise<StudentClassView[]> {
  const history = await loadMyClassHistory(studentId);
  const programs = (await apiFetch("/api/programs/active").catch(() => [])) as {
    id: string;
    name?: string;
    programName?: string;
  }[];
  const programById = new Map(
    programs.map((p) => [String(p.id), p.name || p.programName || ""])
  );

  return Promise.all(
    history.map(async (h) => {
      const classId = String(h.classId);
      const cls = (await apiFetch(`/api/classes/${classId}`).catch(() => null)) as Record<
        string,
        unknown
      > | null;
      let teacherName = "";
      const teacherId = h.teacherId || (cls?.teacherId ? String(cls.teacherId) : "");
      if (teacherId) {
        try {
          const t = (await apiFetch(`/api/teachers/${teacherId}`)) as {
            fullname?: string;
            name?: string;
          };
          teacherName = t?.fullname || t?.name || "";
        } catch {
          teacherName = "";
        }
      }
      const programName = cls?.programId
        ? programById.get(String(cls.programId)) || ""
        : "";
      return {
        id: classId,
        className: h.className || String(cls?.name ?? "Class"),
        courseName: programName || h.className || "Course",
        teacherName: teacherName || "Teacher",
        schedule: cls
          ? formatClassSchedule(cls as Parameters<typeof formatClassSchedule>[0])
          : "Schedule TBD",
        room: h.room || (cls?.room ? String(cls.room) : "TBD"),
        status: h.status || String(cls?.status ?? "OPEN"),
        scheduleDays: cls?.scheduleDays ? String(cls.scheduleDays) : "",
        scheduleTimeStart: cls?.scheduleTimeStart ? String(cls.scheduleTimeStart) : "",
        scheduleTimeEnd: cls?.scheduleTimeEnd ? String(cls.scheduleTimeEnd) : "",
      };
    })
  );
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function normalizeDayName(raw: string): string {
  const s = raw.trim().toLowerCase();
  const map: Record<string, string> = {
    sun: "Sunday",
    sunday: "Sunday",
    mon: "Monday",
    monday: "Monday",
    tue: "Tuesday",
    tues: "Tuesday",
    tuesday: "Tuesday",
    wed: "Wednesday",
    wednesday: "Wednesday",
    thu: "Thursday",
    thur: "Thursday",
    thurs: "Thursday",
    thursday: "Thursday",
    fri: "Friday",
    friday: "Friday",
    sat: "Saturday",
    saturday: "Saturday",
  };
  return map[s] || raw;
}

function dayNumber(day: string): number {
  const idx = DAY_NAMES.indexOf(day);
  return idx >= 0 ? idx : 1;
}

export type StudentScheduleSlot = {
  id: string;
  day: string;
  dayNumber: number;
  startTime: string;
  endTime: string;
  className: string;
  courseName: string;
  teacherName: string;
  room: string;
};

/** Weekly slots from class recurring schedule (reuses {@link loadMyClasses} — no extra class fetches). */
export async function loadMyWeeklySchedule(studentId: string): Promise<StudentScheduleSlot[]> {
  const classes = await loadMyClasses(studentId);
  const slots: StudentScheduleSlot[] = [];

  for (const cls of classes) {
    const days = String(cls.scheduleDays || "")
      .split(/[,;]+/)
      .map((d) => normalizeDayName(d))
      .filter(Boolean);
    const startTime = cls.scheduleTimeStart
      ? String(cls.scheduleTimeStart).slice(0, 5)
      : "09:00";
    const endTime = cls.scheduleTimeEnd ? String(cls.scheduleTimeEnd).slice(0, 5) : "10:30";

    for (const day of days) {
      slots.push({
        id: `${cls.id}-${day}`,
        day,
        dayNumber: dayNumber(day),
        startTime,
        endTime,
        className: cls.className,
        courseName: cls.courseName,
        teacherName: cls.teacherName,
        room: cls.room,
      });
    }
  }

  return slots.sort((a, b) => a.dayNumber - b.dayNumber || a.startTime.localeCompare(b.startTime));
}

export type SessionAttendanceRow = {
  id: string;
  sessionId: string;
  studentId: string;
  status: string;
  notes?: string;
};

export async function loadMySessionAttendance(studentId: string): Promise<SessionAttendanceRow[]> {
  const data = await apiFetch(`/api/session-attendance/student/${studentId}`).catch(() => []);
  return Array.isArray(data) ? (data as SessionAttendanceRow[]) : [];
}

export type AttendanceDisplayRecord = {
  id: string;
  date: string;
  className: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  notes: string;
};

/** LMS session marks first; payroll rows as fallback (student/parent views). */
export async function loadAttendanceRecordsForStudent(
  studentId: string
): Promise<AttendanceDisplayRecord[]> {
  const classById = new Map(
    (await loadMyClasses(studentId)).map((c) => [c.id, c.className])
  );
  const lmsRows = await loadMySessionAttendance(studentId);
  if (lmsRows.length > 0) {
    const uniqueSessionIds = Array.from(new Set(lmsRows.map((r) => r.sessionId)));
    const sessions = await Promise.all(
      uniqueSessionIds.map((sid) => apiFetch(`/api/class-sessions/${sid}`).catch(() => null))
    );
    const sessionById = new Map(
      sessions
        .filter(Boolean)
        .map((s: { id: string; sessionDate?: string; classId?: string }) => [String(s.id), s])
    );
    return lmsRows.map((row) => {
      const session = sessionById.get(row.sessionId) as
        | { sessionDate?: string; classId?: string }
        | undefined;
      return {
        id: row.id,
        date: String(session?.sessionDate ?? new Date().toISOString().split("T")[0]),
        className: classById.get(String(session?.classId ?? "")) || "Class",
        status: row.status as AttendanceDisplayRecord["status"],
        notes: String(row.notes ?? ""),
      };
    });
  }
  const data = (await apiFetch(`/api/attendance?studentId=${encodeURIComponent(studentId)}`).catch(
    () => []
  )) as Record<string, unknown>[];
  if (!Array.isArray(data)) return [];
  return data.map((a) => ({
    id: String(a.id ?? `${a.sessionId}-${a.studentId}`),
    date: String(
      a.attendanceDate ?? a.date ?? new Date().toISOString().split("T")[0]
    ),
    className:
      String(a.className ?? "") || classById.get(String(a.classId ?? "")) || "Class",
    status: String(a.status ?? "PRESENT") as AttendanceDisplayRecord["status"],
    notes: String(a.notes ?? ""),
  }));
}

export async function computeAttendanceRate(studentId: string): Promise<number> {
  const lms = await loadMySessionAttendance(studentId);
  if (lms.length > 0) {
    const present = lms.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    return Math.round((present / lms.length) * 100);
  }
  try {
    const stats = (await apiFetch(`/api/attendance/student/${studentId}/stats`)) as {
      attendanceRate?: number;
      present?: number;
      total?: number;
    };
    if (stats?.attendanceRate != null) {
      return Math.round(Number(stats.attendanceRate));
    }
    if (stats?.present != null && stats?.total != null && stats.total > 0) {
      return Math.round((Number(stats.present) / Number(stats.total)) * 100);
    }
  } catch {
    /* fall through */
  }
  const data = (await apiFetch(`/api/attendance?studentId=${studentId}`).catch(() => [])) as {
    status?: string;
  }[];
  if (!Array.isArray(data) || data.length === 0) return 0;
  const present = data.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  return Math.round((present / data.length) * 100);
}
