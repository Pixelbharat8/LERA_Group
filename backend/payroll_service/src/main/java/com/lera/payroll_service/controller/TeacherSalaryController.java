package com.lera.payroll_service.controller;

import com.lera.payroll_service.dto.TeacherSalaryConfigRequest;
import com.lera.payroll_service.entity.TeacherSalaryConfig;
import com.lera.payroll_service.service.TeacherSalaryConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/salary-config")
@RequiredArgsConstructor
// Reads (salary configs are sensitive HR data) limited to admin/finance + center managers.
// Write methods further restrict to admin/finance via method-level @PreAuthorize below.
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
public class TeacherSalaryController {

    private final TeacherSalaryConfigService teacherSalaryConfigService;

    @GetMapping
    public ResponseEntity<List<TeacherSalaryConfig>> getAllConfigs() {
        return ResponseEntity.ok(teacherSalaryConfigService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeacherSalaryConfig> getConfigById(@PathVariable UUID id) {
        return teacherSalaryConfigService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<TeacherSalaryConfig> getConfigByTeacherId(@PathVariable UUID teacherId) {
        return teacherSalaryConfigService.getByTeacherId(teacherId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','ACCOUNTANT')")
    public ResponseEntity<?> createConfig(@Valid @RequestBody TeacherSalaryConfigRequest request) {
        try {
            TeacherSalaryConfig saved = teacherSalaryConfigService.create(request);
            return ResponseEntity.ok(Map.of("success", true, "data", saved));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Could not save salary configuration"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "An unexpected error occurred"));
        }
    }

    @PutMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','ACCOUNTANT')")
    public ResponseEntity<?> updateConfigByTeacherId(@PathVariable UUID teacherId, @Valid @RequestBody TeacherSalaryConfigRequest request) {
        TeacherSalaryConfig saved = teacherSalaryConfigService.upsertByTeacherId(teacherId, request);
        return ResponseEntity.ok(Map.of("success", true, "data", saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','ACCOUNTANT')")
    public ResponseEntity<?> deleteConfig(@PathVariable UUID id) {
        if (teacherSalaryConfigService.delete(id)) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Salary config deleted"));
        }
        return ResponseEntity.notFound().build();
    }
}
