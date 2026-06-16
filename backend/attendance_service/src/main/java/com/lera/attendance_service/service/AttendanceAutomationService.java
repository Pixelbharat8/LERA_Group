package com.lera.attendance_service.service;

import com.lera.attendance_service.client.NotificationClient;
import com.lera.attendance_service.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Attendance Automation Service
 * Handles daily automated tasks for attendance management
 */
@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class AttendanceAutomationService {

    private final AttendanceRepository attendanceRepository;
    private final JdbcTemplate jdbcTemplate;
    private final NotificationClient notificationClient;
    private final ClassReminderMailService classReminderMailService;

    @Value("${attendance.monthly-report.extra-notify-user-ids:}")
    private String extraMonthlyNotifyUserIds;

    @Value("${attendance.class-reminder.enabled:true}")
    private boolean classReminderEnabled;

    @Value("${attendance.class-reminder.send-email:true}")
    private boolean classReminderSendEmail;

    // ============================================
    // DAILY ATTENDANCE AUTOMATION TASKS
    // ============================================

    /**
     * Daily job to mark students as ABSENT who have scheduled classes but no attendance record
     * Runs at 11:00 PM every day (after all classes are done)
     */
    @Scheduled(cron = "0 0 23 * * ?")
    @Transactional
    public void markAbsentStudentsDaily() {
        log.info("🔄 Starting daily absent marking automation at {}", LocalDateTime.now());
        
        LocalDate today = LocalDate.now();
        int absentCount = 0;
        
        try {
            // Find all students with scheduled classes today but no attendance record
            String query = """
                INSERT INTO class_attendance (id, class_id, student_id, session_date, status, notes, created_at)
                SELECT 
                    gen_random_uuid(),
                    cs.class_id,
                    cst.student_id,
                    ?::date,
                    'ABSENT',
                    'Auto-marked absent by system',
                    NOW()
                FROM class_schedules cs
                JOIN class_students cst ON cs.class_id = cst.class_id
                JOIN classes c ON c.id = cs.class_id
                WHERE c.status = 'ONGOING'
                AND cs.day_of_week = EXTRACT(DOW FROM ?::date)
                AND cst.status = 'ACTIVE'
                AND NOT EXISTS (
                    SELECT 1 FROM class_attendance ca 
                    WHERE ca.class_id = cs.class_id 
                    AND ca.student_id = cst.student_id 
                    AND ca.session_date = ?::date
                )
                ON CONFLICT (class_id, student_id, session_date) DO NOTHING
                """;
            
            absentCount = jdbcTemplate.update(query, today, today, today);
            
            log.info("✅ Daily absent marking completed. {} students marked as ABSENT for {}", absentCount, today);
            
        } catch (Exception e) {
            log.error("❌ Error in daily absent marking: {}", e.getMessage(), e);
        }
    }

    /**
     * Daily job to close attendance sessions that are still open
     * Runs at 10:00 PM every day
     */
    @Scheduled(cron = "0 0 22 * * ?")
    @Transactional
    public void closeOpenAttendanceSessions() {
        log.info("🔄 Closing open attendance sessions at {}", LocalDateTime.now());
        
        LocalDate today = LocalDate.now();
        
        try {
            String query = """
                UPDATE attendance_sessions 
                SET status = 'COMPLETED', 
                    notes = COALESCE(notes, '') || ' [Auto-closed by system]'
                WHERE session_date = ?
                AND status IN ('SCHEDULED', 'IN_PROGRESS')
                """;
            
            int closedCount = jdbcTemplate.update(query, today);
            log.info("✅ Closed {} attendance sessions for {}", closedCount, today);
            
        } catch (Exception e) {
            log.error("❌ Error closing attendance sessions: {}", e.getMessage(), e);
        }
    }

    /**
     * Daily job to flag late arrivals (students who checked in after class start time)
     * Runs at 9:00 PM every day
     */
    @Scheduled(cron = "0 0 21 * * ?")
    @Transactional
    public void flagLateArrivals() {
        log.info("🔄 Flagging late arrivals at {}", LocalDateTime.now());
        
        LocalDate today = LocalDate.now();
        
        try {
            // Update attendance records where check-in time is after scheduled start time
            String query = """
                UPDATE class_attendance ca
                SET status = 'LATE',
                    notes = COALESCE(notes, '') || ' [Late arrival flagged by system]'
                FROM class_schedules cs
                WHERE ca.class_id = cs.class_id
                AND ca.session_date = ?
                AND ca.status = 'PRESENT'
                AND ca.check_in_time IS NOT NULL
                AND ca.check_in_time::time > cs.start_time + interval '10 minutes'
                """;
            
            int lateCount = jdbcTemplate.update(query, today);
            log.info("✅ Flagged {} late arrivals for {}", lateCount, today);
            
        } catch (Exception e) {
            log.error("❌ Error flagging late arrivals: {}", e.getMessage(), e);
        }
    }

    /**
     * Morning reminder job to create attendance sessions for today's classes
     * Runs at 6:00 AM every day
     */
    @Scheduled(cron = "0 0 6 * * ?")
    @Transactional
    public void createDailyAttendanceSessions() {
        log.info("🔄 Creating attendance sessions for today at {}", LocalDateTime.now());
        
        LocalDate today = LocalDate.now();
        int dayOfWeek = today.getDayOfWeek().getValue() % 7; // 0=Sunday, 1=Monday...
        
        try {
            String query = """
                INSERT INTO attendance_sessions (id, tenant_id, class_id, session_date, start_time, end_time, teacher_id, status, created_at)
                SELECT 
                    gen_random_uuid(),
                    c.tenant_id,
                    c.id,
                    ?::date,
                    cs.start_time,
                    cs.end_time,
                    c.teacher_id,
                    'SCHEDULED',
                    NOW()
                FROM class_schedules cs
                JOIN classes c ON c.id = cs.class_id
                WHERE c.status = 'ONGOING'
                AND cs.day_of_week = ?
                AND NOT EXISTS (
                    SELECT 1 FROM attendance_sessions ats 
                    WHERE ats.class_id = c.id 
                    AND ats.session_date = ?::date
                    AND ats.start_time = cs.start_time
                )
                """;
            
            int sessionsCreated = jdbcTemplate.update(query, today, dayOfWeek, today);
            log.info("✅ Created {} attendance sessions for {}", sessionsCreated, today);
            
        } catch (Exception e) {
            log.error("❌ Error creating attendance sessions: {}", e.getMessage(), e);
        }
    }

    /**
     * Weekly job to calculate attendance percentages for all students
     * Runs every Sunday at 11:00 PM
     */
    @Scheduled(cron = "0 0 23 ? * SUN")
    @Transactional
    public void calculateWeeklyAttendanceStats() {
        log.info("🔄 Calculating weekly attendance statistics at {}", LocalDateTime.now());
        
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(7);
        
        try {
            // Update student_progress table with attendance rates
            String query = """
                UPDATE student_progress sp
                SET attendance_rate = (
                    SELECT 
                        COALESCE(
                            COUNT(CASE WHEN ca.status IN ('PRESENT', 'LATE') THEN 1 END) * 100.0 / 
                            NULLIF(COUNT(*), 0),
                            0
                        )
                    FROM class_attendance ca
                    JOIN class_students cs ON ca.class_id = cs.class_id AND ca.student_id = cs.student_id
                    WHERE cs.student_id = sp.student_id
                    AND ca.session_date BETWEEN ? AND ?
                ),
                updated_at = NOW()
                WHERE sp.period = 'WEEKLY'
                """;
            
            int updated = jdbcTemplate.update(query, startDate, endDate);
            log.info("✅ Updated attendance stats for {} student progress records", updated);
            
        } catch (Exception e) {
            log.error("❌ Error calculating weekly attendance stats: {}", e.getMessage(), e);
        }
    }

    /**
     * Monthly job to send attendance summary reports
     * Runs on 1st of every month at 8:00 AM
     */
    @Scheduled(cron = "0 0 8 1 * ?")
    public void generateMonthlyAttendanceReports() {
        log.info("🔄 Generating monthly attendance reports at {}", LocalDateTime.now());
        
        LocalDate today = LocalDate.now();
        LocalDate startOfLastMonth = today.minusMonths(1).withDayOfMonth(1);
        LocalDate endOfLastMonth = today.withDayOfMonth(1).minusDays(1);
        
        try {
            // Generate attendance summary for each class
            String summaryQuery = """
                SELECT
                    c.id as class_id,
                    c.name as class_name,
                    c.class_code,
                    t.id as teacher_id,
                    t.user_id as teacher_user_id,
                    COUNT(DISTINCT cs.student_id) as total_students,
                    COUNT(CASE WHEN ca.status = 'PRESENT' THEN 1 END) as total_present,
                    COUNT(CASE WHEN ca.status = 'ABSENT' THEN 1 END) as total_absent,
                    COUNT(CASE WHEN ca.status = 'LATE' THEN 1 END) as total_late,
                    COUNT(DISTINCT ca.session_date) as total_sessions
                FROM classes c
                LEFT JOIN class_students cs ON c.id = cs.class_id
                LEFT JOIN class_attendance ca ON c.id = ca.class_id
                    AND ca.session_date BETWEEN ? AND ?
                LEFT JOIN teachers t ON c.teacher_id = t.id
                WHERE c.status = 'ONGOING'
                GROUP BY c.id, c.name, c.class_code, t.id, t.user_id
                """;
            
            List<Map<String, Object>> summaries = jdbcTemplate.queryForList(
                summaryQuery, startOfLastMonth, endOfLastMonth
            );
            
            log.info("✅ Generated monthly attendance reports for {} classes", summaries.size());

            String rangeLabel = startOfLastMonth.format(DateTimeFormatter.ISO_LOCAL_DATE)
                    + " – " + endOfLastMonth.format(DateTimeFormatter.ISO_LOCAL_DATE);
            String digest = buildMonthlyDigestText(summaries, rangeLabel);
            sendMonthlyReportNotifications(summaries, rangeLabel, digest);
            
        } catch (Exception e) {
            log.error("❌ Error generating monthly attendance reports: {}", e.getMessage(), e);
        }
    }

    /**
     * Parents receive one digest per child account listing tomorrow's sessions (schedule matrix uses INT {@code day_of_week}, same convention as other jobs).
     */
    @Scheduled(cron = "${attendance.class-reminder.cron:0 0 19 * * ?}")
    public void remindTomorrowClasses() {
        if (!classReminderEnabled) {
            return;
        }
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        int dow = tomorrow.getDayOfWeek().getValue() % 7;
        // Parent links live in the student_parents junction table — the legacy students.parent_id
        // column is unused/NULL, so joining it meant NO class reminders were ever sent to parents.
        final String sql = """
                SELECT sp.parent_id, u.email AS parent_email, c.name AS class_name,
                       cs.start_time::text AS start_t, cs.end_time::text AS end_t
                FROM class_schedules cs
                INNER JOIN classes c ON c.id = cs.class_id
                INNER JOIN class_students cst ON cst.class_id = c.id
                        AND UPPER(TRIM(COALESCE(cst.status, ''))) = 'ACTIVE'
                INNER JOIN students s ON s.id = cst.student_id
                INNER JOIN student_parents sp ON sp.student_id = s.id
                LEFT JOIN users u ON u.id = sp.parent_id
                WHERE UPPER(TRIM(COALESCE(c.status, ''))) = 'ONGOING'
                  AND cs.day_of_week = ?
                """;
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, dow);
            if (rows.isEmpty()) {
                log.debug("No class_schedules rows for tomorrow (dow={})", dow);
                return;
            }
            Map<UUID, List<Map<String, Object>>> byParent = new LinkedHashMap<>();
            for (Map<String, Object> row : rows) {
                Object p = row.get("parent_id");
                if (p == null) {
                    continue;
                }
                UUID pid = p instanceof UUID u ? u : UUID.fromString(p.toString());
                byParent.computeIfAbsent(pid, k -> new ArrayList<>()).add(row);
            }
            for (Map.Entry<UUID, List<Map<String, Object>>> e : byParent.entrySet()) {
                UUID parentId = e.getKey();
                StringBuilder en = new StringBuilder("Classes scheduled for tomorrow:\n");
                StringBuilder vi = new StringBuilder("Lịch học ngày mai:\n");
                for (Map<String, Object> r : e.getValue()) {
                    String cn = Objects.toString(r.get("class_name"), "?");
                    String st = Objects.toString(r.get("start_t"), "");
                    String et = Objects.toString(r.get("end_t"), "");
                    en.append("• ").append(cn).append(" ").append(st).append("–").append(et).append("\n");
                    vi.append("• ").append(cn).append(" ").append(st).append("–").append(et).append("\n");
                }
                notificationClient.notifyUserDigest(
                        parentId,
                        "Class reminder — tomorrow",
                        "Nhắc lịch học — ngày mai",
                        en.toString().trim(),
                        vi.toString().trim(),
                        "schedule");
                if (classReminderSendEmail && !e.getValue().isEmpty()) {
                    Object em = e.getValue().get(0).get("parent_email");
                    String email = em != null ? em.toString().trim() : "";
                    if (!email.isEmpty()) {
                        classReminderMailService.sendTomorrowReminder(email, en.toString().trim());
                    }
                }
            }
            log.info("Class reminders queued for {} parents (tomorrow dow={})", byParent.size(), dow);
        } catch (Exception ex) {
            log.error("Class reminder job failed: {}", ex.getMessage(), ex);
        }
    }

    private String buildMonthlyDigestText(List<Map<String, Object>> summaries, String rangeLabel) {
        StringBuilder sb = new StringBuilder();
        sb.append("Monthly attendance (").append(rangeLabel).append(")\n\n");
        for (Map<String, Object> row : summaries) {
            sb.append(formatMonthlyClassLine(row)).append('\n');
        }
        return sb.toString().trim();
    }

    private String formatMonthlyClassLine(Map<String, Object> row) {
        String name = String.valueOf(row.getOrDefault("class_name", ""));
        String code = String.valueOf(row.getOrDefault("class_code", ""));
        return String.format(
                "%s (%s) — students %s, present %s, absent %s, late %s, sessions %s",
                name,
                code,
                fmtNum(row.get("total_students")),
                fmtNum(row.get("total_present")),
                fmtNum(row.get("total_absent")),
                fmtNum(row.get("total_late")),
                fmtNum(row.get("total_sessions")));
    }

    private static String fmtNum(Object o) {
        if (o == null) {
            return "0";
        }
        if (o instanceof Number n) {
            return String.valueOf(n.longValue());
        }
        return o.toString();
    }

    private void sendMonthlyReportNotifications(
            List<Map<String, Object>> summaries,
            String rangeLabel,
            String fullDigest) {
        Map<UUID, StringBuilder> byTeacher = new LinkedHashMap<>();
        for (Map<String, Object> row : summaries) {
            Object uid = row.get("teacher_user_id");
            if (uid == null) {
                continue;
            }
            UUID teacherUserId = uid instanceof UUID u ? u : UUID.fromString(uid.toString());
            byTeacher
                    .computeIfAbsent(teacherUserId, k -> new StringBuilder())
                    .append(formatMonthlyClassLine(row))
                    .append('\n');
        }

        String title = "Monthly attendance summary";
        String titleVi = "Báo cáo điểm danh tháng";

        for (Map.Entry<UUID, StringBuilder> e : byTeacher.entrySet()) {
            String msg = "Period: " + rangeLabel + "\n\n" + e.getValue().toString().trim();
            String msgVi = "Kỳ: " + rangeLabel + "\n\n" + e.getValue().toString().trim();
            Map<String, Object> req = new HashMap<>();
            req.put("userIds", List.of(e.getKey()));
            req.put("title", title);
            req.put("titleVi", titleVi);
            req.put("message", msg);
            req.put("messageVi", msgVi);
            req.put("type", "info");
            req.put("referenceType", "attendance");
            notificationClient.triggerNotification(req);
        }

        List<UUID> extras = parseUuidList(extraMonthlyNotifyUserIds);
        if (!extras.isEmpty()) {
            Map<String, Object> req = new HashMap<>();
            req.put("userIds", extras);
            req.put("title", title + " (all classes)");
            req.put("titleVi", titleVi + " (tất cả lớp)");
            req.put("message", fullDigest);
            req.put("messageVi", fullDigest);
            req.put("type", "info");
            req.put("referenceType", "attendance");
            notificationClient.triggerNotification(req);
        }
    }

    private static List<UUID> parseUuidList(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of();
        }
        List<UUID> out = new ArrayList<>();
        for (String part : raw.split(",")) {
            String s = part.trim();
            if (s.isEmpty()) {
                continue;
            }
            try {
                out.add(UUID.fromString(s));
            } catch (IllegalArgumentException ignored) {
                // ignore malformed id
            }
        }
        return out;
    }

    // ============================================
    // MANUAL TRIGGER METHODS (for API calls)
    // ============================================

    /**
     * Manually trigger absent marking for a specific date
     */
    @Transactional
    public int markAbsentForDate(LocalDate date) {
        log.info("Manual absent marking triggered for {}", date);
        
        String query = """
            INSERT INTO class_attendance (id, class_id, student_id, session_date, status, notes, created_at)
            SELECT 
                gen_random_uuid(),
                cs.class_id,
                cst.student_id,
                ?::date,
                'ABSENT',
                'Manually marked absent by admin',
                NOW()
            FROM class_schedules cs
            JOIN class_students cst ON cs.class_id = cst.class_id
            JOIN classes c ON c.id = cs.class_id
            WHERE c.status = 'ONGOING'
            AND cs.day_of_week = EXTRACT(DOW FROM ?::date)
            AND cst.status = 'ACTIVE'
            AND NOT EXISTS (
                SELECT 1 FROM class_attendance ca 
                WHERE ca.class_id = cs.class_id 
                AND ca.student_id = cst.student_id 
                AND ca.session_date = ?::date
            )
            ON CONFLICT (class_id, student_id, session_date) DO NOTHING
            """;
        
        return jdbcTemplate.update(query, date, date, date);
    }

    /**
     * Get attendance automation status and statistics
     */
    public Map<String, Object> getAutomationStatus() {
        LocalDate today = LocalDate.now();
        
        // Get today's statistics
        String statsQuery = """
            SELECT 
                COUNT(*) as total_records,
                COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present_count,
                COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent_count,
                COUNT(CASE WHEN status = 'LATE' THEN 1 END) as late_count,
                COUNT(CASE WHEN notes LIKE '%Auto-marked%' THEN 1 END) as auto_marked_count
            FROM class_attendance
            WHERE session_date = ?
            """;
        
        Map<String, Object> stats = jdbcTemplate.queryForMap(statsQuery, today);
        
        stats.put("date", today.toString());
        stats.put("automationEnabled", true);
        stats.put("scheduledJobs", List.of(
            Map.of("name", "Daily Absent Marking", "schedule", "11:00 PM daily"),
            Map.of("name", "Close Sessions", "schedule", "10:00 PM daily"),
            Map.of("name", "Flag Late Arrivals", "schedule", "9:00 PM daily"),
            Map.of("name", "Create Sessions", "schedule", "6:00 AM daily"),
            Map.of("name", "Weekly Stats", "schedule", "11:00 PM every Sunday"),
            Map.of("name", "Monthly Reports", "schedule", "8:00 AM on 1st of month"),
            Map.of("name", "Leave Accrual", "schedule", "12:00 AM on 1st of month")
        ));
        
        return stats;
    }
}
