package com.lera.academy_service.controller;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.security.AcademyRoles;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Timetable — now derived from real {@link ClassEntity} schedule data (was a fabricated stub).
 * Each class' scheduleDays/scheduleTime build the weekly entries.
 */
@RestController
@RequestMapping("/api/timetable")
@PreAuthorize(AcademyRoles.STAFF)
public class TimetableController {

    private final ClassRepository classRepository;
    private final com.lera.academy_service.security.AcademyAuthorizationService authz;
    private final JdbcTemplate jdbcTemplate;

    public TimetableController(ClassRepository classRepository,
                              com.lera.academy_service.security.AcademyAuthorizationService authz,
                              JdbcTemplate jdbcTemplate) {
        this.classRepository = classRepository;
        this.authz = authz;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Classes store their days as the codes the class form writes: "MON,WED,FRI". The timetable
     * grid places each entry by a day INDEX (0 = Sunday ... 6 = Saturday) and compared that number
     * against this string, so nothing ever matched: the whole week rendered empty, along with
     * "today's classes" and the next-class banner. Send the index too.
     *
     * Matched on the first three letters, which are unambiguous for every day (a bare "T" or "S"
     * is not, so those are left unresolved rather than guessed).
     */
    private static Integer dayIndex(String day) {
        if (day == null) return null;
        String key = day.trim().toUpperCase();
        if (key.length() < 3) return null;
        return switch (key.substring(0, 3)) {
            case "SUN" -> 0;
            case "MON" -> 1;
            case "TUE" -> 2;
            case "WED" -> 3;
            case "THU" -> 4;
            case "FRI" -> 5;
            case "SAT" -> 6;
            default -> null;
        };
    }

    /** display_name for each class' teacher, in one query — the grid shows the teacher's name. */
    private Map<UUID, String> teacherNames(List<ClassEntity> classes) {
        List<UUID> ids = classes.stream().map(ClassEntity::getTeacherId)
                .filter(Objects::nonNull).distinct().toList();
        Map<UUID, String> names = new HashMap<>();
        if (ids.isEmpty()) return names;
        String ph = String.join(",", Collections.nCopies(ids.size(), "?"));
        jdbcTemplate.query("SELECT id, display_name FROM teachers WHERE id IN (" + ph + ")",
                (java.sql.ResultSet rs) -> {
                    names.put(rs.getObject("id", UUID.class), rs.getString("display_name"));
                }, ids.toArray());
        return names;
    }

    private List<Map<String, Object>> entriesFor(List<ClassEntity> classes) {
        List<Map<String, Object>> entries = new ArrayList<>();
        Map<UUID, String> teachers = teacherNames(classes);
        for (ClassEntity c : classes) {
            String days = c.getScheduleDays();
            List<String> dayList = (days == null || days.isBlank())
                    ? Collections.singletonList(null)
                    : Arrays.stream(days.split("[,;/]")).map(String::trim).filter(s -> !s.isEmpty()).toList();
            for (String day : dayList) {
                Map<String, Object> e = new LinkedHashMap<>();
                e.put("id", c.getId() + (day != null ? "-" + day : ""));
                e.put("classId", c.getId());
                e.put("className", c.getName());
                e.put("subject", c.getName());
                e.put("teacherId", c.getTeacherId());
                e.put("teacherName", teachers.get(c.getTeacherId()));
                e.put("room", c.getRoom());
                e.put("roomNumber", c.getRoom());
                e.put("dayOfWeek", day);
                e.put("day", day);
                e.put("dayIndex", dayIndex(day));
                e.put("startTime", c.getScheduleTimeStart() != null ? c.getScheduleTimeStart().toString() : null);
                e.put("endTime", c.getScheduleTimeEnd() != null ? c.getScheduleTimeEnd().toString() : null);
                entries.add(e);
            }
        }
        return entries;
    }

    private List<ClassEntity> resolve(UUID teacherId, UUID centerId) {
        UUID eff = authz.effectiveListCenterId(centerId);   // throws 403 on cross-centre request
        if (teacherId != null) return classRepository.findByTeacherId(teacherId);
        if (eff != null) return classRepository.findByCenterIdAndStatus(eff, "OPEN");
        return classRepository.findByStatus("OPEN");
    }

    @GetMapping("/my-schedule")
    public ResponseEntity<List<Map<String, Object>>> getMySchedule(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) UUID teacherId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID centerId) {
        return ResponseEntity.ok(entriesFor(resolve(teacherId, centerId)));
    }

    @GetMapping("/weekly")
    public ResponseEntity<Map<String, List<Map<String, Object>>>> getWeeklyTimetable(
            @RequestParam(required = false) UUID centerId) {
        Map<String, List<Map<String, Object>>> weekly = new LinkedHashMap<>();
        for (String d : List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")) {
            weekly.put(d, new ArrayList<>());
        }
        for (Map<String, Object> e : entriesFor(resolve(null, centerId))) {
            Object day = e.get("dayOfWeek");
            if (day == null) continue;
            for (String key : weekly.keySet()) {
                if (key.equalsIgnoreCase(day.toString()) || key.toLowerCase().startsWith(day.toString().toLowerCase())) {
                    weekly.get(key).add(e);
                    break;
                }
            }
        }
        return ResponseEntity.ok(weekly);
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Map<String, Object>>> getClassTimetable(@PathVariable UUID classId) {
        return ResponseEntity.ok(classRepository.findById(classId)
                .map(c -> entriesFor(List.of(c))).orElse(Collections.emptyList()));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<Map<String, Object>>> getTeacherTimetable(@PathVariable UUID teacherId) {
        return ResponseEntity.ok(entriesFor(classRepository.findByTeacherId(teacherId)));
    }
}
