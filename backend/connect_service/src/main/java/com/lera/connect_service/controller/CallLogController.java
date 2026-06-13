package com.lera.connect_service.controller;

import com.lera.connect_service.entity.CallLog;
import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.repository.CallLogRepository;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Call logs — now DB-backed via {@link CallLogRepository} (was an in-memory stub that lost
 * history on restart). The JSON shape returned matches what the CRM Communications page expects
 * (userId / callType / duration / outcome / status / callDate).
 */
@RestController
@RequestMapping("/api/call-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class CallLogController {

    private final CallLogRepository callLogRepository;
    private final LeadRepository leadRepository;

    private Lead requireAccessibleLead(AuthUser user, UUID leadId) {
        if (leadId == null) return null;
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
        ConnectSecurity.assertCanAccessLead(user, lead);
        return lead;
    }

    private boolean canAccess(AuthUser user, CallLog log) {
        if (log == null) return false;
        if (ConnectSecurity.isOrgWide(user)) return true;
        if (log.getLeadId() != null) {
            return leadRepository.findById(log.getLeadId()).map(lead -> {
                try { ConnectSecurity.assertCanAccessLead(user, lead); return true; }
                catch (ResponseStatusException ex) { return false; }
            }).orElse(false);
        }
        UUID self = ConnectSecurity.requireUserId(user);
        return self.equals(log.getCallerId());
    }

    private List<CallLog> visible(AuthUser user) {
        List<CallLog> all = callLogRepository.findAll();
        if (ConnectSecurity.isOrgWide(user)) return all;
        return all.stream().filter(l -> canAccess(user, l)).toList();
    }

    /** Map the entity to the JSON shape the frontend expects. */
    private Map<String, Object> toResponse(CallLog c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("leadId", c.getLeadId());
        m.put("userId", c.getCallerId());
        m.put("phoneNumber", c.getPhoneNumber());
        m.put("callType", c.getCallType());
        m.put("direction", c.getCallType());
        m.put("duration", c.getCallDuration());
        m.put("outcome", c.getOutcome());
        m.put("status", c.getCallStatus());
        m.put("notes", c.getNotes());
        m.put("callDate", c.getCalledAt());
        return m;
    }

    private static Integer toInt(Object o) {
        if (o instanceof Number n) return n.intValue();
        if (o != null) { try { return Integer.parseInt(o.toString()); } catch (NumberFormatException ignored) {} }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll(
            @RequestParam(required = false) UUID leadId,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal AuthUser authUser) {
        java.util.stream.Stream<CallLog> s = visible(authUser).stream();
        if (leadId != null) { requireAccessibleLead(authUser, leadId); s = s.filter(l -> leadId.equals(l.getLeadId())); }
        if (userId != null) {
            UUID self = ConnectSecurity.requireUserId(authUser);
            if (!ConnectSecurity.isOrgWide(authUser) && !self.equals(userId))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another user's call logs");
            s = s.filter(l -> userId.equals(l.getCallerId()));
        }
        if (status != null && !status.isEmpty()) s = s.filter(l -> status.equalsIgnoreCase(l.getCallStatus()));
        List<Map<String, Object>> out = s
                .sorted(Comparator.comparing(CallLog::getCalledAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse).toList();
        return ResponseEntity.ok(out);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable UUID id, @AuthenticationPrincipal AuthUser authUser) {
        return callLogRepository.findById(id)
                .filter(l -> canAccess(authUser, l))
                .map(l -> ResponseEntity.ok(toResponse(l)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<Map<String, Object>>> getByLead(@PathVariable UUID leadId, @AuthenticationPrincipal AuthUser authUser) {
        requireAccessibleLead(authUser, leadId);
        List<Map<String, Object>> out = callLogRepository.findByLeadIdOrderByCalledAtDesc(leadId)
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(out);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> req, @AuthenticationPrincipal AuthUser authUser) {
        UUID self = ConnectSecurity.requireUserId(authUser);
        UUID leadId = req.get("leadId") != null ? UUID.fromString(req.get("leadId").toString()) : null;
        if (leadId != null) requireAccessibleLead(authUser, leadId);
        UUID userId = req.get("userId") != null ? UUID.fromString(req.get("userId").toString()) : self;
        if (!self.equals(userId) && !ConnectSecurity.isOrgWide(authUser))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot create call logs for another user");

        CallLog c = CallLog.builder()
                .leadId(leadId)
                .callerId(userId)
                .phoneNumber(Objects.toString(req.getOrDefault("phoneNumber", ""), ""))
                .callType(Objects.toString(req.getOrDefault("callType", req.getOrDefault("direction", "OUTBOUND")), "OUTBOUND"))
                .callDuration(toInt(req.getOrDefault("duration", 0)))
                .callStatus(Objects.toString(req.getOrDefault("status", "COMPLETED"), "COMPLETED"))
                .outcome(req.get("outcome") != null ? req.get("outcome").toString() : null)
                .notes(req.get("notes") != null ? req.get("notes").toString() : null)
                .calledAt(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(toResponse(callLogRepository.save(c)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable UUID id, @RequestBody Map<String, Object> req, @AuthenticationPrincipal AuthUser authUser) {
        return callLogRepository.findById(id).filter(l -> canAccess(authUser, l)).map(c -> {
            if (req.containsKey("phoneNumber")) c.setPhoneNumber(Objects.toString(req.get("phoneNumber"), null));
            if (req.containsKey("callType")) c.setCallType(Objects.toString(req.get("callType"), null));
            if (req.containsKey("direction")) c.setCallType(Objects.toString(req.get("direction"), null));
            if (req.containsKey("duration")) c.setCallDuration(toInt(req.get("duration")));
            if (req.containsKey("status")) c.setCallStatus(Objects.toString(req.get("status"), null));
            if (req.containsKey("outcome")) c.setOutcome(Objects.toString(req.get("outcome"), null));
            if (req.containsKey("notes")) c.setNotes(Objects.toString(req.get("notes"), null));
            return ResponseEntity.ok(toResponse(callLogRepository.save(c)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal AuthUser authUser) {
        return callLogRepository.findById(id).filter(l -> canAccess(authUser, l)).map(c -> {
            callLogRepository.delete(c);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(@RequestParam(required = false) UUID userId, @AuthenticationPrincipal AuthUser authUser) {
        List<CallLog> logs = visible(authUser);
        if (userId != null) {
            UUID self = ConnectSecurity.requireUserId(authUser);
            if (!ConnectSecurity.isOrgWide(authUser) && !self.equals(userId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            logs = logs.stream().filter(l -> userId.equals(l.getCallerId())).toList();
        }
        int totalDuration = logs.stream().mapToInt(l -> l.getCallDuration() != null ? l.getCallDuration() : 0).sum();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalCalls", logs.size());
        stats.put("completedCalls", logs.stream().filter(l -> "COMPLETED".equals(l.getCallStatus())).count());
        stats.put("missedCalls", logs.stream().filter(l -> "MISSED".equals(l.getCallStatus())).count());
        stats.put("inboundCalls", logs.stream().filter(l -> "INBOUND".equals(l.getCallType())).count());
        stats.put("outboundCalls", logs.stream().filter(l -> "OUTBOUND".equals(l.getCallType())).count());
        stats.put("totalDuration", totalDuration);
        stats.put("averageDuration", logs.isEmpty() ? 0 : totalDuration / logs.size());
        return ResponseEntity.ok(stats);
    }
}
