package com.lera.connect_service.controller;

import com.lera.connect_service.entity.CampaignLead;
import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.repository.CampaignLeadRepository;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.CampaignLeadService;
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
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/campaign-leads")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class CampaignLeadController {

    private final CampaignLeadService campaignLeadService;
    private final CampaignLeadRepository campaignLeadRepository;
    private final LeadRepository leadRepository;

    private Lead requireAccessibleLead(AuthUser user, UUID leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
        ConnectSecurity.assertCanAccessLead(user, lead);
        return lead;
    }

    private void assertCampaignLeadAccess(AuthUser user, CampaignLead campaignLead) {
        if (campaignLead == null || campaignLead.getLeadId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        requireAccessibleLead(user, campaignLead.getLeadId());
    }

    private List<CampaignLead> filterByCenter(AuthUser user, List<CampaignLead> rows) {
        if (ConnectSecurity.isOrgWide(user)) {
            return rows;
        }
        UUID jwtCenter = user.getCenterId();
        if (jwtCenter == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return rows.stream()
                .filter(cl -> leadRepository.findById(cl.getLeadId())
                        .map(lead -> jwtCenter.equals(lead.getCenterId()))
                        .orElse(false))
                .toList();
    }

    @GetMapping
    public ResponseEntity<List<CampaignLead>> getAllCampaignLeads(
            @RequestParam(required = false) UUID centerId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        if (eff != null) {
            return ResponseEntity.ok(campaignLeadRepository.findByLeadCenterId(eff));
        }
        if (ConnectSecurity.isOrgWide(authUser)) {
            return ResponseEntity.ok(campaignLeadService.getAll(pageable).getContent());
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "centerId is required for campaign lead list queries unless you have an org-wide role");
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampaignLead> getCampaignLeadById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return campaignLeadService.getById(id)
                .map(cl -> {
                    assertCampaignLeadAccess(authUser, cl);
                    return ResponseEntity.ok(cl);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/campaign/{campaignId}")
    public ResponseEntity<List<CampaignLead>> getLeadsByCampaign(
            @PathVariable UUID campaignId,
            @AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(filterByCenter(authUser, campaignLeadService.getByCampaignId(campaignId)));
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<CampaignLead>> getCampaignsByLead(
            @PathVariable UUID leadId,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, leadId);
        return ResponseEntity.ok(campaignLeadService.getByLeadId(leadId));
    }

    @PostMapping
    public ResponseEntity<CampaignLead> addLeadToCampaign(
            @Valid @RequestBody CampaignLead campaignLead,
            @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, campaignLead.getLeadId());
        return ResponseEntity.ok(campaignLeadService.create(campaignLead));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeLeadFromCampaign(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return campaignLeadService.getById(id)
                .map(cl -> {
                    assertCampaignLeadAccess(authUser, cl);
                    if (campaignLeadService.delete(id)) {
                        return ResponseEntity.noContent().<Void>build();
                    }
                    return ResponseEntity.notFound().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
