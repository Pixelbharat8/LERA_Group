package com.lera.connect_service.controller;

import com.lera.connect_service.dto.ConvertLeadRequest;
import com.lera.connect_service.dto.ConvertLeadResponse;
import com.lera.connect_service.dto.PlacementSyncReasons;
import com.lera.connect_service.dto.PlacementSyncResult;
import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.entity.Followup;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.repository.FollowupRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.JdbcAuditWriter;
import com.lera.connect_service.service.LeadPlacementSyncService;
import com.lera.connect_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','STAFF')")
public class LeadController {

    private static final ObjectMapper AUDIT_JSON = new ObjectMapper();

    private final LeadRepository leadRepository;
    private final FollowupRepository followupRepository;
    private final JdbcAuditWriter auditWriter;
    private final LeadPlacementSyncService leadPlacementSyncService;
    private final NotificationService notificationService;
    
    /**
     * Get all leads with optional filtering by centerId and status
     * Frontend calls: GET /api/leads?centerId=...&status=...
     */
    @GetMapping
    public ResponseEntity<List<Lead>> getAllLeads(
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal AuthUser authUser) {

        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        List<Lead> leads;
        if (eff != null && status != null) {
            leads = leadRepository.findByCenterIdAndStatusOrderByCreatedAtDesc(eff, status);
        } else if (eff != null) {
            leads = leadRepository.findByCenterIdOrderByCreatedAtDesc(eff);
        } else if (status != null) {
            if (!ConnectSecurity.isOrgWide(authUser)) {
                UUID scoped = ConnectSecurity.effectiveCenterId(authUser, null);
                leads = leadRepository.findByCenterIdAndStatusOrderByCreatedAtDesc(scoped, status);
            } else {
                leads = leadRepository.findByStatusOrderByCreatedAtDesc(status);
            }
        } else if (ConnectSecurity.isOrgWide(authUser)) {
            leads = leadRepository.findAllByOrderByCreatedAtDesc();
        } else {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "centerId is required for lead list queries unless you have an org-wide role");
        }
        return ResponseEntity.ok(leads);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Lead> getLeadById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return leadRepository.findById(id)
                .map(lead -> {
                    ConnectSecurity.assertCanAccessLead(authUser, lead);
                    return ResponseEntity.ok(lead);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Lead>> getLeadsByStatus(
            @PathVariable String status,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isOrgWide(authUser)) {
            UUID eff = ConnectSecurity.effectiveCenterId(authUser, null);
            return ResponseEntity.ok(leadRepository.findByCenterIdAndStatusOrderByCreatedAtDesc(eff, status));
        }
        return ResponseEntity.ok(leadRepository.findByStatusOrderByCreatedAtDesc(status));
    }
    
    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<Lead>> getLeadsByCenter(
            @PathVariable UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        return ResponseEntity.ok(leadRepository.findByCenterIdOrderByCreatedAtDesc(eff));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getLeadStats(
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        Map<String, Object> stats = new HashMap<>();
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);

        if (eff != null) {
            // Stats filtered by center
            stats.put("newCount", leadRepository.countByCenterIdAndStatus(eff, "NEW"));
            stats.put("contactedCount", leadRepository.countByCenterIdAndStatus(eff, "CONTACTED"));
            stats.put("qualifiedCount", leadRepository.countByCenterIdAndStatus(eff, "QUALIFIED"));
            stats.put("convertedCount", leadRepository.countByCenterIdAndStatus(eff, "CONVERTED"));
            stats.put("lostCount", leadRepository.countByCenterIdAndStatus(eff, "LOST"));
            stats.put("totalCount", leadRepository.findByCenterIdOrderByCreatedAtDesc(eff).size());
        } else if (ConnectSecurity.isOrgWide(authUser)) {
            // Global stats
            stats.put("newCount", leadRepository.countByStatus("NEW"));
            stats.put("contactedCount", leadRepository.countByStatus("CONTACTED"));
            stats.put("qualifiedCount", leadRepository.countByStatus("QUALIFIED"));
            stats.put("convertedCount", leadRepository.countByStatus("CONVERTED"));
            stats.put("lostCount", leadRepository.countByStatus("LOST"));
            stats.put("totalCount", leadRepository.count());
        } else {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "centerId is required for lead stats unless you have an org-wide role");
        }
        return ResponseEntity.ok(stats);
    }
    
    @PostMapping
    public ResponseEntity<Lead> createLead(
            @Valid @RequestBody Lead lead,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isOrgWide(authUser)) {
            UUID jwt = authUser != null ? authUser.getCenterId() : null;
            if (jwt == null) {
                return ResponseEntity.status(403).build();
            }
            if (lead.getCenterId() != null && !lead.getCenterId().equals(jwt)) {
                return ResponseEntity.status(403).build();
            }
            lead.setCenterId(jwt);
        }
        return ResponseEntity.ok(leadRepository.save(lead));
    }
    
    @PostMapping("/bulk")
    public ResponseEntity<List<Lead>> createLeadsBulk(
            @Valid @RequestBody List<Lead> leads,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isOrgWide(authUser)) {
            UUID jwt = authUser != null ? authUser.getCenterId() : null;
            if (jwt == null) {
                return ResponseEntity.status(403).build();
            }
            for (Lead lead : leads) {
                if (lead.getCenterId() != null && !lead.getCenterId().equals(jwt)) {
                    return ResponseEntity.status(403).build();
                }
                lead.setCenterId(jwt);
            }
        }
        List<Lead> savedLeads = leadRepository.saveAll(leads);
        return ResponseEntity.ok(savedLeads);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Lead> updateLead(
            @PathVariable UUID id,
            @Valid @RequestBody Lead leadDetails,
            @AuthenticationPrincipal AuthUser authUser) {
        return leadRepository.findById(id).map(lead -> {
            ConnectSecurity.assertCanAccessLead(authUser, lead);
            if (leadDetails.getParentName() != null) lead.setParentName(leadDetails.getParentName());
            if (leadDetails.getParentEmail() != null) lead.setParentEmail(leadDetails.getParentEmail());
            if (leadDetails.getParentPhone() != null) lead.setParentPhone(leadDetails.getParentPhone());
            if (leadDetails.getStudentName() != null) lead.setStudentName(leadDetails.getStudentName());
            if (leadDetails.getStudentAge() != null) lead.setStudentAge(leadDetails.getStudentAge());
            if (leadDetails.getStatus() != null) lead.setStatus(leadDetails.getStatus());
            if (leadDetails.getAssignedTo() != null) lead.setAssignedTo(leadDetails.getAssignedTo());
            if (leadDetails.getNotes() != null) lead.setNotes(leadDetails.getNotes());
            return ResponseEntity.ok(leadRepository.save(lead));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/convert")
    public ResponseEntity<ConvertLeadResponse> convertLead(
            @PathVariable UUID id,
            @RequestBody(required = false) ConvertLeadRequest body,
            @AuthenticationPrincipal AuthUser currentUser) {
        return leadRepository.findById(id).map(lead -> {
            ConnectSecurity.assertCanAccessLead(currentUser, lead);
            String oldStatus = lead.getStatus();
            lead.setStatus("CONVERTED");
            lead.setConversionDate(LocalDate.now());
            if (body != null && body.getStudentId() != null) {
                lead.setConvertedStudentId(body.getStudentId());
            }
            Lead saved = leadRepository.save(lead);
            PlacementSyncResult sync;
            if (body != null && body.getStudentId() != null) {
                sync = leadPlacementSyncService.trySyncPlacementFromLead(body.getStudentId(), saved.getNotes(), id);
            } else {
                sync = PlacementSyncResult.builder()
                        .attempted(false)
                        .success(false)
                        .reason(PlacementSyncReasons.NO_STUDENT_LINKED)
                        .detail("No student id supplied — link a student to import placement notes.")
                        .leadId(id)
                        .studentId(null)
                        .updatedExisting(null)
                        .build();
            }
            auditWriter.log("LEAD_CONVERTED", "Lead", id, actorUserId(currentUser),
                    "{\"status\":\"" + (oldStatus == null ? "" : oldStatus) + "\"}",
                    placementAuditNewValues("CONVERTED", sync));
            notifyAssignedOnPlacementFailure(saved, sync, "convert");
            return ResponseEntity.ok(new ConvertLeadResponse(saved, sync));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Re-import the informal placement block from a lead's notes into Academy. Useful when staff
     * fixed a typo, re-linked a different student, or Academy was unreachable at convert time.
     * Safe to call repeatedly — Academy upserts by {@code (student_id, source_lead_id)}.
     *
     * <p>{@code studentId} resolves from the request body, falling back to {@code lead.convertedStudentId}.
     * If neither is set, returns 400 with a structured {@link PlacementSyncResult} so the dashboard
     * can render the same banner as convert.
     */
    @PostMapping("/{id}/placement-sync")
    public ResponseEntity<PlacementSyncResult> resyncPlacement(
            @PathVariable UUID id,
            @RequestBody(required = false) ConvertLeadRequest body,
            @AuthenticationPrincipal AuthUser currentUser) {
        return leadRepository.findById(id).map(lead -> {
            ConnectSecurity.assertCanAccessLead(currentUser, lead);
            UUID studentId = (body != null && body.getStudentId() != null)
                    ? body.getStudentId()
                    : lead.getConvertedStudentId();
            if (studentId == null) {
                PlacementSyncResult missing = PlacementSyncResult.builder()
                        .attempted(false)
                        .success(false)
                        .reason(PlacementSyncReasons.NO_STUDENT_LINKED)
                        .detail("Re-sync needs a studentId; lead has no convertedStudentId either.")
                        .leadId(id)
                        .studentId(null)
                        .updatedExisting(null)
                        .build();
                auditWriter.log("LEAD_PLACEMENT_RESYNC", "Lead", id, actorUserId(currentUser), null,
                        placementAuditNewValues(lead.getStatus(), missing));
                return ResponseEntity.badRequest().body(missing);
            }
            PlacementSyncResult sync = leadPlacementSyncService.trySyncPlacementFromLead(
                    studentId, lead.getNotes(), id);
            auditWriter.log("LEAD_PLACEMENT_RESYNC", "Lead", id, actorUserId(currentUser), null,
                    placementAuditNewValues(lead.getStatus(), sync));
            notifyAssignedOnPlacementFailure(lead, sync, "re-import");
            return ResponseEntity.ok(sync);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Pushes an in-app + native notification to {@code lead.assignedTo} when placement sync
     * actually attempted and failed. Skipped silently if there's no assignee or if the sync
     * succeeded / was never attempted (banner already covers the actor).
     */
    private void notifyAssignedOnPlacementFailure(Lead lead, PlacementSyncResult sync, String action) {
        if (lead == null || sync == null || !sync.isAttempted() || sync.isSuccess()) {
            return;
        }
        UUID assignee = lead.getAssignedTo();
        if (assignee == null) {
            return;
        }
        String name = lead.getParentName() != null ? lead.getParentName() : "Unknown lead";
        String reason = sync.getReason() != null ? sync.getReason() : "unknown";
        String title = "Placement import needs attention";
        String titleVi = "Cần xử lý đồng bộ placement";
        String actionVi = "convert".equals(action) ? "chuyển đổi" : "nhập lại";
        String message = "CRM lead " + name + " (" + action + ") — placement sync failed: " + reason
                + ". Open the lead to retry from the dashboard.";
        String messageVi = "Lead CRM " + name + " (" + actionVi + ") — đồng bộ placement thất bại: " + reason
                + ". Mở lead để thử lại.";
        try {
            notificationService.createNotification(
                    assignee,
                    title,
                    titleVi,
                    message,
                    messageVi,
                    "CRM_PLACEMENT_SYNC",
                    "Lead",
                    lead.getId());
        } catch (RuntimeException ex) {
            // Notifications must never block a successful convert/resync response.
            log.warn("Failed to enqueue placement-sync notification for assignee {} (lead {}): {}",
                    assignee, lead.getId(), ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLead(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser currentUser) {
        Lead existing = leadRepository.findById(id).orElse(null);
        if (existing != null) {
            ConnectSecurity.assertCanAccessLead(currentUser, existing);
            leadRepository.deleteById(id);
            auditWriter.log("LEAD_DELETED", "Lead", id, actorUserId(currentUser), null, null);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /** Prefer JWT principal for audit actor; {@link JdbcAuditWriter} still falls back to SecurityContext when null. */
    private static UUID actorUserId(AuthUser currentUser) {
        return currentUser != null ? currentUser.getUserId() : null;
    }

    private static String placementAuditNewValues(String status, PlacementSyncResult sync) {
        Map<String, Object> nv = new LinkedHashMap<>();
        nv.put("status", status == null ? "" : status);
        Map<String, Object> ps = new LinkedHashMap<>();
        ps.put("attempted", sync.isAttempted());
        ps.put("success", sync.isSuccess());
        ps.put("reason", sync.getReason() != null ? sync.getReason() : "");
        ps.put("detail", truncateAuditDetail(sync.getDetail()));
        if (sync.getUpdatedExisting() != null) {
            ps.put("updatedExisting", sync.getUpdatedExisting());
        }
        nv.put("placementSync", ps);
        try {
            return AUDIT_JSON.writeValueAsString(nv);
        } catch (JsonProcessingException e) {
            return "{\"status\":\"" + (status == null ? "" : status) + "\"}";
        }
    }

    private static String truncateAuditDetail(String detail) {
        if (detail == null || detail.isEmpty()) {
            return "";
        }
        return detail.length() > 500 ? detail.substring(0, 500) + "…" : detail;
    }

    // Followup endpoints
    @GetMapping("/{leadId}/followups")
    public ResponseEntity<List<Followup>> getFollowups(
            @PathVariable UUID leadId,
            @AuthenticationPrincipal AuthUser authUser) {
        Lead lead = leadRepository.findById(leadId).orElse(null);
        if (lead == null) {
            return ResponseEntity.notFound().build();
        }
        ConnectSecurity.assertCanAccessLead(authUser, lead);
        return ResponseEntity.ok(followupRepository.findByLeadIdOrderByCreatedAtDesc(leadId));
    }
    
    @PostMapping("/{leadId}/followups")
    public ResponseEntity<Followup> addFollowup(
            @PathVariable UUID leadId,
            @Valid @RequestBody Followup followup,
            @AuthenticationPrincipal AuthUser authUser) {
        Lead lead = leadRepository.findById(leadId).orElse(null);
        if (lead == null) {
            return ResponseEntity.notFound().build();
        }
        ConnectSecurity.assertCanAccessLead(authUser, lead);
        followup.setLeadId(leadId);
        Followup saved = followupRepository.save(followup);
        return ResponseEntity.ok(saved);
    }

    // --- Marketing ROI: lead-funnel conversion grouped by channel ---

    @GetMapping("/analytics/by-source")
    public ResponseEntity<List<Map<String, Object>>> analyticsBySource(
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        return ResponseEntity.ok(mapFunnelRows(leadRepository.conversionBySource(eff)));
    }

    @GetMapping("/analytics/by-campaign")
    public ResponseEntity<List<Map<String, Object>>> analyticsByCampaign(
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        return ResponseEntity.ok(mapFunnelRows(leadRepository.conversionByCampaign(eff)));
    }

    private List<Map<String, Object>> mapFunnelRows(List<Object[]> rows) {
        List<Map<String, Object>> out = new java.util.ArrayList<>();
        for (Object[] r : rows) {
            long total = ((Number) r[1]).longValue();
            long trial = ((Number) r[2]).longValue();
            long converted = ((Number) r[3]).longValue();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("channel", r[0] != null ? r[0].toString() : "Direct / Unknown");
            m.put("leads", total);
            m.put("trials", trial);
            m.put("converted", converted);
            m.put("conversionRate", total > 0 ? Math.round((converted * 1000.0) / total) / 10.0 : 0);
            out.add(m);
        }
        return out;
    }
}
