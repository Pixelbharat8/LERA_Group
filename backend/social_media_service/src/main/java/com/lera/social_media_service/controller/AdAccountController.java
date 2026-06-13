package com.lera.social_media_service.controller;

import com.lera.social_media_service.entity.AdAccount;
import com.lera.social_media_service.repository.AdAccountRepository;
import com.lera.social_media_service.security.AuthUser;
import com.lera.social_media_service.security.SocialMediaSecurity;
import com.lera.social_media_service.service.JdbcAuditWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/ad-accounts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class AdAccountController {
    
    private final AdAccountRepository adAccountRepository;
    private final JdbcAuditWriter auditWriter;

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
    
    @GetMapping
    public ResponseEntity<List<AdAccount>> getAllAccounts(Pageable pageable) {
        return ResponseEntity.ok(adAccountRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AdAccount> getAccountById(@PathVariable UUID id) {
        return adAccountRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/platform/{platform}")
    public ResponseEntity<List<AdAccount>> getAccountsByPlatform(@PathVariable String platform) {
        return ResponseEntity.ok(adAccountRepository.findByPlatform(platform));
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<AdAccount>> getActiveAccounts() {
        return ResponseEntity.ok(adAccountRepository.findByIsActiveTrue());
    }
    
    @GetMapping("/connected")
    public ResponseEntity<List<AdAccount>> getConnectedAccounts() {
        return ResponseEntity.ok(adAccountRepository.findByIsConnectedTrue());
    }
    
    @PostMapping
    public ResponseEntity<AdAccount> createAccount(
            @Valid @RequestBody AdAccount account,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        account.setCreatedAt(LocalDateTime.now());
        account.setUpdatedAt(LocalDateTime.now());
        AdAccount saved = adAccountRepository.save(account);
        auditWriter.log("AD_ACCOUNT_CREATED", "AdAccount", saved.getId(), null, null,
                "{\"platform\":\"" + esc(saved.getPlatform()) + "\"}");
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AdAccount> updateAccount(
            @PathVariable UUID id,
            @Valid @RequestBody AdAccount details,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        return adAccountRepository.findById(id).map(account -> {
            Boolean wasActive = account.getIsActive();
            if (details.getAccountName() != null) account.setAccountName(details.getAccountName());
            if (details.getDailyBudget() != null) account.setDailyBudget(details.getDailyBudget());
            if (details.getTotalBudget() != null) account.setTotalBudget(details.getTotalBudget());
            if (details.getIsActive() != null) account.setIsActive(details.getIsActive());
            account.setUpdatedAt(LocalDateTime.now());
            AdAccount saved = adAccountRepository.save(account);
            auditWriter.log("AD_ACCOUNT_UPDATED", "AdAccount", id, null,
                    "{\"isActive\":" + wasActive + "}",
                    "{\"isActive\":" + saved.getIsActive() + "}");
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/connect")
    public ResponseEntity<AdAccount> connectAccount(
            @PathVariable UUID id,
            @Valid @RequestBody Map<String, String> credentials,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        return adAccountRepository.findById(id).map(account -> {
            boolean wasConnected = Boolean.TRUE.equals(account.getIsConnected());
            account.setIsConnected(true);
            if (credentials.get("accessToken") != null) account.setAccessToken(credentials.get("accessToken"));
            if (credentials.get("refreshToken") != null) account.setRefreshToken(credentials.get("refreshToken"));
            account.setLastSyncAt(LocalDateTime.now());
            account.setUpdatedAt(LocalDateTime.now());
            AdAccount saved = adAccountRepository.save(account);
            auditWriter.log("AD_ACCOUNT_CONNECTED", "AdAccount", id, null,
                    "{\"isConnected\":" + wasConnected + "}", "{\"isConnected\":true}");
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/disconnect")
    public ResponseEntity<AdAccount> disconnectAccount(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        return adAccountRepository.findById(id).map(account -> {
            account.setIsConnected(false);
            account.setAccessToken(null);
            account.setRefreshToken(null);
            account.setUpdatedAt(LocalDateTime.now());
            AdAccount saved = adAccountRepository.save(account);
            auditWriter.log("AD_ACCOUNT_DISCONNECTED", "AdAccount", id, null,
                    "{\"isConnected\":true}", "{\"isConnected\":false}");
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        Optional<AdAccount> opt = adAccountRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        AdAccount account = opt.get();
        auditWriter.log("AD_ACCOUNT_DELETED", "AdAccount", id, null,
                "{\"platform\":\"" + esc(account.getPlatform()) + "\"}", null);
        adAccountRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
