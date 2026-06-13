package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.ClassSchedule;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.ClassScheduleRepository;
import com.lera.academy_service.service.ClassRosterNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/class-schedules")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class ClassScheduleController {
    
    private final ClassScheduleRepository classScheduleRepository;
    private final ClassRepository classRepository;
    private final ClassRosterNotificationService classRosterNotificationService;
    
    @GetMapping
    public ResponseEntity<List<ClassSchedule>> getAllSchedules(Pageable pageable) {
        return ResponseEntity.ok(classScheduleRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ClassSchedule> getScheduleById(@PathVariable UUID id) {
        return classScheduleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<ClassSchedule>> getSchedulesByClass(@PathVariable UUID classId) {
        return ResponseEntity.ok(classScheduleRepository.findByClassId(classId));
    }
    
    @GetMapping("/day/{dayOfWeek}")
    public ResponseEntity<List<ClassSchedule>> getSchedulesByDay(@PathVariable String dayOfWeek) {
        return ResponseEntity.ok(classScheduleRepository.findByDayOfWeek(dayOfWeek));
    }
    
    @PostMapping
    public ResponseEntity<ClassSchedule> createSchedule(@Valid @RequestBody ClassSchedule schedule) {
        ClassSchedule saved = classScheduleRepository.save(schedule);
        notifyScheduleFeed(saved.getClassId(),
                "Weekly slot added: " + saved.getDayOfWeek() + " " + saved.getStartTime() + "–" + saved.getEndTime());
        return ResponseEntity.ok(saved);
    }
    
    @PostMapping("/bulk")
    public ResponseEntity<List<ClassSchedule>> createBulkSchedules(@Valid @RequestBody List<ClassSchedule> schedules) {
        return ResponseEntity.ok(classScheduleRepository.saveAll(schedules));
    }
    
    @PutMapping("/{id}")
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
            if (scheduleDetails.getIsActive() != null) schedule.setIsActive(scheduleDetails.getIsActive());
            ClassSchedule saved = classScheduleRepository.save(schedule);
            notifyScheduleFeed(saved.getClassId(),
                    "Weekly slot updated: " + saved.getDayOfWeek() + " " + saved.getStartTime() + "–" + saved.getEndTime());
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable UUID id) {
        Optional<ClassSchedule> opt = classScheduleRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        UUID classId = opt.get().getClassId();
        classScheduleRepository.deleteById(id);
        notifyScheduleFeed(classId, "A weekly time slot was removed from this class schedule.");
        return ResponseEntity.noContent().build();
    }

    private void notifyScheduleFeed(UUID classId, String description) {
        if (classId == null) return;
        try {
            ClassEntity cls = classRepository.findById(classId).orElse(null);
            if (cls != null) {
                classRosterNotificationService.notifyScheduleChange(cls, description);
            }
        } catch (Exception ignored) {
            // Non-blocking
        }
    }
}
