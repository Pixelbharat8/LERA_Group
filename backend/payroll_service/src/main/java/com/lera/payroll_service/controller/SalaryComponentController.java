package com.lera.payroll_service.controller;

import com.lera.payroll_service.entity.SalaryComponent;
import com.lera.payroll_service.service.SalaryComponentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/salary-components")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class SalaryComponentController {

    private final SalaryComponentService salaryComponentService;

    @GetMapping
    public ResponseEntity<List<SalaryComponent>> getAllComponents() {
        return ResponseEntity.ok(salaryComponentService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryComponent> getComponentById(@PathVariable UUID id) {
        return salaryComponentService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<SalaryComponent>> getComponentsByType(@PathVariable String type) {
        return ResponseEntity.ok(salaryComponentService.getByType(type));
    }

    @GetMapping("/active")
    public ResponseEntity<List<SalaryComponent>> getActiveComponents() {
        return ResponseEntity.ok(salaryComponentService.getActive());
    }

    @GetMapping("/earnings")
    public ResponseEntity<List<SalaryComponent>> getEarningsComponents() {
        return ResponseEntity.ok(salaryComponentService.getByType("EARNING"));
    }

    @GetMapping("/deductions")
    public ResponseEntity<List<SalaryComponent>> getDeductionComponents() {
        return ResponseEntity.ok(salaryComponentService.getByType("DEDUCTION"));
    }

    @PostMapping
    public ResponseEntity<SalaryComponent> createComponent(@Valid @RequestBody SalaryComponent component) {
        return ResponseEntity.ok(salaryComponentService.create(component));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalaryComponent> updateComponent(@PathVariable UUID id, @Valid @RequestBody SalaryComponent componentDetails) {
        return salaryComponentService.update(id, componentDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<SalaryComponent> toggleActive(@PathVariable UUID id) {
        return salaryComponentService.toggleActive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComponent(@PathVariable UUID id) {
        return salaryComponentService.delete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
