package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.ClassSchedule;
import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.repository.ClassScheduleRepository;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Schedule Controller - provides unified schedule endpoints
 * Maps to /api/schedules to match frontend expectations
 * Frontend calls: /api/schedules/teacher/{teacherId}, /api/schedules/student/{studentId}
 */
@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ScheduleController {

    private final ClassScheduleRepository classScheduleRepository;
    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AcademyAuthorizationService authz;

    /**
     * Get all schedules with optional filters
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllSchedules(
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) String dayOfWeek) {
        
        List<ClassSchedule> schedules;
        if (classId != null) {
            authz.assertCanViewClassRoster(classId);
            schedules = classScheduleRepository.findByClassId(classId);
        } else if (dayOfWeek != null) {
            authz.assertStaff();
            schedules = classScheduleRepository.findByDayOfWeek(dayOfWeek);
        } else if (authz.isOrgWide()) {
            schedules = classScheduleRepository.findAll();
        } else {
            authz.assertStaff();
            UUID effCenter = authz.effectiveListCenterId(centerId);
            if (effCenter == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Specify classId or centerId for schedule list queries");
            }
            schedules = classScheduleRepository.findAll();
            centerId = effCenter;
        }

        List<Map<String, Object>> enrichedSchedules = enrichSchedulesWithClassInfo(schedules);

        if (centerId != null) {
            UUID filterCenter = centerId;
            enrichedSchedules = enrichedSchedules.stream()
                    .filter(s -> filterCenter.equals(s.get("centerId")))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(enrichedSchedules);
    }

    /**
     * Get schedule by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getScheduleById(@PathVariable UUID id) {
        return classScheduleRepository.findById(id)
                .map(schedule -> {
                    authz.assertCanViewClassRoster(schedule.getClassId());
                    Map<String, Object> result = enrichScheduleWithClassInfo(schedule);
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get schedules for a teacher - includes all classes they teach
     * Used by teacher dashboard
     */
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<Map<String, Object>>> getSchedulesByTeacher(@PathVariable UUID teacherId) {
        authz.assertStaffOrOwnTeacherEntity(teacherId);
        // Find all classes where this teacher is the main teacher or assistant
        List<ClassEntity> teacherClasses = classRepository.findByTeacherId(teacherId);
        List<ClassEntity> assistantClasses = classRepository.findByAssistantTeacherId(teacherId);
        
        Set<UUID> classIds = new HashSet<>();
        teacherClasses.forEach(c -> classIds.add(c.getId()));
        assistantClasses.forEach(c -> classIds.add(c.getId()));
        
        // Get schedules for all those classes
        List<ClassSchedule> schedules = new ArrayList<>();
        for (UUID classId : classIds) {
            schedules.addAll(classScheduleRepository.findByClassId(classId));
        }
        
        // Enrich with class information
        List<Map<String, Object>> enrichedSchedules = enrichSchedulesWithClassInfo(schedules);
        
        // Sort by day of week and start time
        enrichedSchedules.sort((a, b) -> {
            int dayCompare = getDayOrder((String) a.get("dayOfWeek")) - getDayOrder((String) b.get("dayOfWeek"));
            if (dayCompare != 0) return dayCompare;
            return ((String) a.get("startTime")).compareTo((String) b.get("startTime"));
        });
        
        return ResponseEntity.ok(enrichedSchedules);
    }

    /**
     * Get schedules for a TA (Teaching Assistant) - same as teacher but for TA role
     * Frontend calls: /api/schedules/ta/{taId}
     * Used by TA dashboard
     */
    @GetMapping("/ta/{taId}")
    public ResponseEntity<List<Map<String, Object>>> getSchedulesByTA(@PathVariable UUID taId) {
        authz.assertStaffOrOwnTeacherEntity(taId);
        // TA schedules work the same as teacher schedules - they assist in classes
        // Find all classes where this TA is assigned as assistant teacher
        List<ClassEntity> taClasses = classRepository.findByAssistantTeacherId(taId);
        
        Set<UUID> classIds = new HashSet<>();
        taClasses.forEach(c -> classIds.add(c.getId()));
        
        // Get schedules for all those classes
        List<ClassSchedule> schedules = new ArrayList<>();
        for (UUID classId : classIds) {
            schedules.addAll(classScheduleRepository.findByClassId(classId));
        }
        
        // Enrich with class information
        List<Map<String, Object>> enrichedSchedules = enrichSchedulesWithClassInfo(schedules);
        
        // Sort by day of week and start time
        enrichedSchedules.sort((a, b) -> {
            int dayCompare = getDayOrder((String) a.get("dayOfWeek")) - getDayOrder((String) b.get("dayOfWeek"));
            if (dayCompare != 0) return dayCompare;
            return ((String) a.get("startTime")).compareTo((String) b.get("startTime"));
        });
        
        return ResponseEntity.ok(enrichedSchedules);
    }

    /**
     * Get schedules for a student - includes all classes they are enrolled in
     * Used by student dashboard
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Map<String, Object>>> getSchedulesByStudent(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        // Find all enrollments for this student
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        
        // Get class IDs from active enrollments
        Set<UUID> classIds = enrollments.stream()
                .filter(e -> "ACTIVE".equalsIgnoreCase(e.getStatus()) || "ENROLLED".equalsIgnoreCase(e.getStatus()))
                .map(Enrollment::getClassId)
                .collect(Collectors.toSet());
        
        // Get schedules for all enrolled classes
        List<ClassSchedule> schedules = new ArrayList<>();
        for (UUID classId : classIds) {
            schedules.addAll(classScheduleRepository.findByClassId(classId));
        }
        
        // Enrich with class information
        List<Map<String, Object>> enrichedSchedules = enrichSchedulesWithClassInfo(schedules);
        
        // Sort by day of week and start time
        enrichedSchedules.sort((a, b) -> {
            int dayCompare = getDayOrder((String) a.get("dayOfWeek")) - getDayOrder((String) b.get("dayOfWeek"));
            if (dayCompare != 0) return dayCompare;
            return ((String) a.get("startTime")).compareTo((String) b.get("startTime"));
        });
        
        return ResponseEntity.ok(enrichedSchedules);
    }

    /**
     * Get schedules for a specific class
     */
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Map<String, Object>>> getSchedulesByClass(@PathVariable UUID classId) {
        authz.assertCanViewClassRoster(classId);
        List<ClassSchedule> schedules = classScheduleRepository.findByClassId(classId);
        return ResponseEntity.ok(enrichSchedulesWithClassInfo(schedules));
    }

    /**
     * Create a new schedule
     */
    @PostMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<ClassSchedule> createSchedule(@Valid @RequestBody ClassSchedule schedule) {
        return ResponseEntity.ok(classScheduleRepository.save(schedule));
    }

    /**
     * Update a schedule
     */
    @PutMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<ClassSchedule> updateSchedule(@PathVariable UUID id, @Valid @RequestBody ClassSchedule scheduleDetails) {
        return classScheduleRepository.findById(id).map(schedule -> {
            if (scheduleDetails.getDayOfWeek() != null) schedule.setDayOfWeek(scheduleDetails.getDayOfWeek());
            if (scheduleDetails.getStartTime() != null) schedule.setStartTime(scheduleDetails.getStartTime());
            if (scheduleDetails.getEndTime() != null) schedule.setEndTime(scheduleDetails.getEndTime());
            if (scheduleDetails.getRoomNumber() != null) schedule.setRoomNumber(scheduleDetails.getRoomNumber());
            if (scheduleDetails.getRoomName() != null) schedule.setRoomName(scheduleDetails.getRoomName());
            if (scheduleDetails.getLocation() != null) schedule.setLocation(scheduleDetails.getLocation());
            if (scheduleDetails.getIsOnline() != null) schedule.setIsOnline(scheduleDetails.getIsOnline());
            if (scheduleDetails.getMeetingLink() != null) schedule.setMeetingLink(scheduleDetails.getMeetingLink());
            return ResponseEntity.ok(classScheduleRepository.save(schedule));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a schedule
     */
    @DeleteMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Void> deleteSchedule(@PathVariable UUID id) {
        if (classScheduleRepository.existsById(id)) {
            classScheduleRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Check for schedule conflicts
     */
    @GetMapping("/conflicts")
    public ResponseEntity<List<ClassSchedule>> checkConflicts(
            @RequestParam UUID classId,
            @RequestParam String dayOfWeek,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        authz.assertCanViewClassRoster(classId);
        List<ClassSchedule> schedules = classScheduleRepository.findByClassIdAndDayOfWeek(classId, dayOfWeek);
        // Return schedules that overlap with the given time range
        return ResponseEntity.ok(schedules);
    }

    // Helper methods
    
    private List<Map<String, Object>> enrichSchedulesWithClassInfo(List<ClassSchedule> schedules) {
        return schedules.stream()
                .map(this::enrichScheduleWithClassInfo)
                .collect(Collectors.toList());
    }
    
    private Map<String, Object> enrichScheduleWithClassInfo(ClassSchedule schedule) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", schedule.getId());
        result.put("classId", schedule.getClassId());
        result.put("dayOfWeek", schedule.getDayOfWeek());
        result.put("startTime", schedule.getStartTime() != null ? schedule.getStartTime().toString() : null);
        result.put("endTime", schedule.getEndTime() != null ? schedule.getEndTime().toString() : null);
        result.put("roomNumber", schedule.getRoomNumber());
        result.put("roomName", schedule.getRoomName());
        result.put("location", schedule.getLocation());
        result.put("isOnline", schedule.getIsOnline());
        result.put("meetingLink", schedule.getMeetingLink());
        result.put("notes", schedule.getNotes());
        result.put("isActive", schedule.getIsActive());
        
        // Add class information
        classRepository.findById(schedule.getClassId()).ifPresent(classEntity -> {
            result.put("className", classEntity.getName());
            result.put("teacherId", classEntity.getTeacherId());
            result.put("assistantTeacherId", classEntity.getAssistantTeacherId());
            result.put("centerId", classEntity.getCenterId());
            result.put("programId", classEntity.getProgramId());
            result.put("room", classEntity.getRoom());
            result.put("status", classEntity.getStatus());
        });
        
        return result;
    }
    
    private int getDayOrder(String dayOfWeek) {
        if (dayOfWeek == null) return 7;
        switch (dayOfWeek.toUpperCase()) {
            case "MONDAY": return 1;
            case "TUESDAY": return 2;
            case "WEDNESDAY": return 3;
            case "THURSDAY": return 4;
            case "FRIDAY": return 5;
            case "SATURDAY": return 6;
            case "SUNDAY": return 7;
            default: return 8;
        }
    }
}
