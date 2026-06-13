package com.lera.payroll_service.controller;

import com.lera.payroll_service.entity.TaxSettings;
import com.lera.payroll_service.service.TaxSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tax-settings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
public class TaxSettingsController {

    private final TaxSettingsService taxSettingsService;

    @GetMapping
    public ResponseEntity<List<TaxSettings>> getAllTaxSettings() {
        return ResponseEntity.ok(taxSettingsService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaxSettings> getTaxSettingsById(@PathVariable UUID id) {
        return taxSettingsService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<TaxSettings> getTaxSettingsByType(@PathVariable String type) {
        return taxSettingsService.getByType(type)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public ResponseEntity<List<TaxSettings>> getActiveTaxSettings() {
        return ResponseEntity.ok(taxSettingsService.getActive());
    }

    @PostMapping
    public ResponseEntity<TaxSettings> createTaxSettings(@Valid @RequestBody TaxSettings taxSettings) {
        return ResponseEntity.ok(taxSettingsService.create(taxSettings));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaxSettings> updateTaxSettings(@PathVariable UUID id, @Valid @RequestBody TaxSettings taxSettingsDetails) {
        return taxSettingsService.update(id, taxSettingsDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<TaxSettings> toggleActive(@PathVariable UUID id) {
        return taxSettingsService.toggleActive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTaxSettings(@PathVariable UUID id) {
        return taxSettingsService.delete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
