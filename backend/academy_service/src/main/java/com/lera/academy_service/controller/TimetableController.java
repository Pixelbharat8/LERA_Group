package com.lera.academy_service.controller;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.security.AcademyRoles;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    public TimetableController(ClassRepository classRepository) {
        this.classRepository = classRepository;
    }

    private List<Map<String, Object>> entriesFor(List<ClassEntity> classes) {
        List<Map<String, Object>> entries = new ArrayList<>();
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
                e.put("room", c.getRoom());
                e.put("roomNumber", c.getRoom());
                e.put("dayOfWeek", day);
                e.put("day", day);
                e.put("startTime", c.getScheduleTimeStart() != null ? c.getScheduleTimeStart().toString() : null);
                e.put("endTime", c.getScheduleTimeEnd() != null ? c.getScheduleTimeEnd().toString() : null);
                entries.add(e);
            }
        }
        return entries;
    }

    private List<ClassEntity> resolve(UUID teacherId, UUID centerId) {
        if (teacherId != null) return classRepository.findByTeacherId(teacherId);
        if (centerId != null) return classRepository.findByCenterIdAndStatus(centerId, "OPEN");
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
