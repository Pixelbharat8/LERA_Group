package com.lera.connect_service.controller;

import com.lera.connect_service.entity.AdAccount;
import com.lera.connect_service.repository.AdAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
// DEPRECATED 2026-05: canonical implementation lives in social_media_service.
@RequestMapping("/api/_deprecated/ad-accounts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
public class AdAccountController {
    
    private final AdAccountRepository adAccountRepository;
    
    @GetMapping
    public ResponseEntity<List<AdAccount>> getAllAccounts(Pageable pageable) {
        return ResponseEntity.ok(adAccountRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<AdAccount>> getActiveAccounts() {
        return ResponseEntity.ok(adAccountRepository.findByIsActiveTrueOrderByPlatform());
    }
    
    @GetMapping("/platform/{platform}")
    public ResponseEntity<List<AdAccount>> getByPlatform(@PathVariable String platform) {
        return ResponseEntity.ok(adAccountRepository.findByPlatform(platform));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AdAccount> getAccountById(@PathVariable UUID id) {
        return adAccountRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<AdAccount> createAccount(@Valid @RequestBody AdAccount account) {
        return ResponseEntity.ok(adAccountRepository.save(account));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AdAccount> updateAccount(@PathVariable UUID id, @Valid @RequestBody AdAccount details) {
        return adAccountRepository.findById(id).map(account -> {
            if (details.getAccountName() != null) account.setAccountName(details.getAccountName());
            if (details.getCurrency() != null) account.setCurrency(details.getCurrency());
            if (details.getTimezone() != null) account.setTimezone(details.getTimezone());
            if (details.getDailyBudget() != null) account.setDailyBudget(details.getDailyBudget());
            if (details.getMonthlyBudget() != null) account.setMonthlyBudget(details.getMonthlyBudget());
            if (details.getIsActive() != null) account.setIsActive(details.getIsActive());
            return ResponseEntity.ok(adAccountRepository.save(account));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable UUID id) {
        if (adAccountRepository.existsById(id)) {
            adAccountRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
