package com.lera.payroll_service.controller;

import com.lera.payroll_service.entity.Bonus;
import com.lera.payroll_service.service.BonusService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/payroll/bonuses")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
public class BonusController {
    
    private final BonusService bonusService;
    
    @GetMapping
    public ResponseEntity<?> getAllBonuses(Pageable pageable) {
        return ResponseEntity.ok(bonusService.getAll(pageable));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Bonus> getBonusById(@PathVariable Long id) {
        return bonusService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<Bonus>> getBonusesByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(bonusService.getByTeacher(teacherId));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Bonus> createBonus(@Valid @RequestBody Bonus bonus) {
        return ResponseEntity.ok(bonusService.create(bonus));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Bonus> updateBonus(@PathVariable Long id, @Valid @RequestBody Bonus bonusDetails) {
        return bonusService.update(id, bonusDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteBonus(@PathVariable Long id) {
        return bonusService.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
