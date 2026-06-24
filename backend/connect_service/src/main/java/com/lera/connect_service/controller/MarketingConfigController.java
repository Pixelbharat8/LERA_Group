package com.lera.connect_service.controller;

import com.lera.connect_service.entity.MarketingConfig;
import com.lera.connect_service.repository.MarketingConfigRepository;
import com.lera.connect_service.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Per-person marketing comp config (commission % + monthly target). Chairman/admins only. */
@RestController
@RequestMapping("/api/marketing-config")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
public class MarketingConfigController {

    private final MarketingConfigRepository repository;

    @GetMapping
    public ResponseEntity<List<MarketingConfig>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<MarketingConfig> getByUser(@PathVariable UUID userId) {
        return repository.findByUserId(userId).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    /** Upsert one person's config. Body: { commissionPct, monthlyTarget, centerId? }. */
    @PutMapping("/user/{userId}")
    public ResponseEntity<MarketingConfig> upsert(
            @PathVariable UUID userId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal AuthUser authUser) {
        MarketingConfig cfg = repository.findByUserId(userId).orElseGet(MarketingConfig::new);
        cfg.setUserId(userId);
        if (body.get("commissionPct") != null) cfg.setCommissionPct(new BigDecimal(body.get("commissionPct").toString()));
        if (body.get("monthlyTarget") != null) cfg.setMonthlyTarget(new BigDecimal(body.get("monthlyTarget").toString()));
        if (body.get("centerId") != null) cfg.setCenterId(UUID.fromString(body.get("centerId").toString()));
        return ResponseEntity.ok(repository.save(cfg));
    }
}
