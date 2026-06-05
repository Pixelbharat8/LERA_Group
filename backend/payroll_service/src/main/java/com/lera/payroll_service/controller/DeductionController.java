package com.lera.payroll_service.controller;

import com.lera.payroll_service.entity.Deduction;
import com.lera.payroll_service.service.DeductionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/payroll/deductions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
public class DeductionController {
    
    private final DeductionService deductionService;
    
    @GetMapping
    public ResponseEntity<?> getAllDeductions(Pageable pageable) {
        return ResponseEntity.ok(deductionService.getAll(pageable));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Deduction> getDeductionById(@PathVariable Long id) {
        return deductionService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<Deduction>> getDeductionsByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(deductionService.getByTeacher(teacherId));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Deduction> createDeduction(@Valid @RequestBody Deduction deduction) {
        return ResponseEntity.ok(deductionService.create(deduction));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Deduction> updateDeduction(@PathVariable Long id, @Valid @RequestBody Deduction deductionDetails) {
        return deductionService.update(id, deductionDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteDeduction(@PathVariable Long id) {
        return deductionService.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
