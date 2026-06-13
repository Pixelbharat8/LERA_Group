package com.lera.identity_service.controller;

import com.lera.identity_service.entity.LoginHistory;
import com.lera.identity_service.repository.LoginHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/login-history")
@RequiredArgsConstructor
// Login history is security-audit data (incl. failed logins) and supports clearing a user's
// history — admins only, never students/parents/teachers/staff.
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
public class LoginHistoryController {
    
    private final LoginHistoryRepository loginHistoryRepository;
    
    @GetMapping
    public ResponseEntity<List<LoginHistory>> getAllLoginHistory(Pageable pageable) {
        return ResponseEntity.ok(loginHistoryRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LoginHistory>> getLoginHistoryByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(loginHistoryRepository.findByUserId(userId));
    }
    
    @GetMapping("/recent")
    public ResponseEntity<List<LoginHistory>> getRecentLogins(Pageable pageable) {
        return ResponseEntity.ok(loginHistoryRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/failed")
    public ResponseEntity<List<LoginHistory>> getFailedLogins(Pageable pageable) {
        return ResponseEntity.ok(loginHistoryRepository.findAll(pageable).getContent().stream()
                .filter(h -> "FAILED".equals(h.getStatus()))
                .collect(java.util.stream.Collectors.toList()));
    }
    
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> clearUserLoginHistory(@PathVariable UUID userId) {
        List<LoginHistory> history = loginHistoryRepository.findByUserId(userId);
        loginHistoryRepository.deleteAll(history);
        return ResponseEntity.noContent().build();
    }
}
