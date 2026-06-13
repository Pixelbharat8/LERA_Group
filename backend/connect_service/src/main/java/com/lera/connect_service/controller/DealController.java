package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Deal;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.DealServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/deals")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class DealController {

    private final DealServiceImpl dealService;
    private final LeadRepository leadRepository;

    private void assertCanAccessDeal(AuthUser user, Deal deal) {
        if (deal == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (ConnectSecurity.isOrgWide(user)) {
            return;
        }
        UUID eff = ConnectSecurity.effectiveCenterId(user, deal.getCenterId());
        if (deal.getCenterId() != null && eff != null && eff.equals(deal.getCenterId())) {
            return;
        }
        if (deal.getLeadId() != null) {
            var lead = leadRepository.findById(deal.getLeadId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
            ConnectSecurity.assertCanAccessLead(user, lead);
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access this deal");
    }

    @GetMapping
    public ResponseEntity<List<Deal>> getAllDeals(
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) String stage,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        if (eff != null && stage != null) {
            return ResponseEntity.ok(dealService.getByCenterIdAndStage(eff, stage));
        }
        if (eff != null) {
            return ResponseEntity.ok(dealService.getByCenterId(eff));
        }
        if (stage != null) {
            if (!ConnectSecurity.isOrgWide(authUser)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "centerId is required when filtering deals by stage");
            }
            return ResponseEntity.ok(dealService.getByStage(stage));
        }
        if (ConnectSecurity.isOrgWide(authUser)) {
            return ResponseEntity.ok(dealService.getAll());
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "centerId is required for deal list queries unless you have an org-wide role");
    }

    @GetMapping("/{id}")
    public ResponseEntity<Deal> getDealById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return dealService.getById(id)
                .map(deal -> {
                    assertCanAccessDeal(authUser, deal);
                    return ResponseEntity.ok(deal);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<Deal>> getDealsByLead(
            @PathVariable UUID leadId,
            @AuthenticationPrincipal AuthUser authUser) {
        return leadRepository.findById(leadId)
                .map(lead -> {
                    ConnectSecurity.assertCanAccessLead(authUser, lead);
                    return ResponseEntity.ok(dealService.getByLeadId(leadId));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Deal> createDeal(
            @Valid @RequestBody Deal deal,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isOrgWide(authUser)) {
            UUID jwt = authUser.getCenterId();
            if (jwt == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            if (deal.getCenterId() != null && !deal.getCenterId().equals(jwt)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            deal.setCenterId(jwt);
        }
        return ResponseEntity.ok(dealService.create(deal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Deal> updateDeal(
            @PathVariable UUID id,
            @Valid @RequestBody Deal dealDetails,
            @AuthenticationPrincipal AuthUser authUser) {
        return dealService.getById(id)
                .map(existing -> {
                    assertCanAccessDeal(authUser, existing);
                    return dealService.update(id, dealDetails)
                            .map(ResponseEntity::ok)
                            .orElse(ResponseEntity.notFound().build());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeal(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return dealService.getById(id)
                .map(deal -> {
                    assertCanAccessDeal(authUser, deal);
                    dealService.delete(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
