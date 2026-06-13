package com.lera.payroll_service.controller;

import com.lera.payroll_service.entity.TeacherOvertime;
import com.lera.payroll_service.service.TeacherOvertimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teacher-overtime")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
public class TeacherOvertimeController {

    private final TeacherOvertimeService teacherOvertimeService;

    @GetMapping
    public ResponseEntity<List<TeacherOvertime>> getAllOvertime() {
        return ResponseEntity.ok(teacherOvertimeService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeacherOvertime> getOvertimeById(@PathVariable UUID id) {
        return teacherOvertimeService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<TeacherOvertime>> getOvertimeByTeacher(@PathVariable UUID teacherId) {
        return ResponseEntity.ok(teacherOvertimeService.getByTeacher(teacherId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TeacherOvertime>> getOvertimeByStatus(@PathVariable String status) {
        return ResponseEntity.ok(teacherOvertimeService.getByStatus(status));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<TeacherOvertime>> getOvertimeByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(teacherOvertimeService.getByDateRange(startDate, endDate));
    }

    @PostMapping
    public ResponseEntity<TeacherOvertime> createOvertime(@Valid @RequestBody TeacherOvertime overtime) {
        return ResponseEntity.ok(teacherOvertimeService.create(overtime));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeacherOvertime> updateOvertime(@PathVariable UUID id, @Valid @RequestBody TeacherOvertime overtimeDetails) {
        return teacherOvertimeService.update(id, overtimeDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOvertime(@PathVariable UUID id) {
        return teacherOvertimeService.delete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
