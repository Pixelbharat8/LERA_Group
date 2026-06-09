package com.lera.academy_service.controller;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.Renewal;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.RenewalRepository;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.security.AcademyAuthorizationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Re-enrolment / retention pipeline. Detects students whose enrolment is ending soon and lets
 * staff work them PENDING → CONTACTED → RENEWED / DECLINED / CHURNED. DB-backed.
 */
@RestController
@RequestMapping("/api/renewals")
@PreAuthorize(AcademyRoles.STAFF)
public class RenewalController {

    private final RenewalRepository renewalRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassRepository classRepository;
    private final AcademyAuthorizationService authz;

    public RenewalController(RenewalRepository renewalRepository,
                            EnrollmentRepository enrollmentRepository,
                            ClassRepository classRepository,
                            AcademyAuthorizationService authz) {
        this.renewalRepository = renewalRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.classRepository = classRepository;
        this.authz = authz;
    }

    /** Throws 403 if a centre-bound caller tries to touch another centre's renewal. */
    private void assertCenter(Renewal r) {
        authz.effectiveListCenterId(r.getCenterId());
    }

    @GetMapping
    public ResponseEntity<List<Renewal>> list(@RequestParam(required = false) String status,
                                              @RequestParam(required = false) UUID centerId) {
        UUID eff = authz.effectiveListCenterId(centerId);
        boolean hasStatus = status != null && !status.isBlank();
        List<Renewal> result;
        if (eff != null) {
            result = hasStatus ? renewalRepository.findByCenterIdAndStatusOrderByEndDateAsc(eff, status)
                               : renewalRepository.findByCenterIdOrderByEndDateAsc(eff);
        } else {
            result = hasStatus ? renewalRepository.findByStatusOrderByEndDateAsc(status)
                               : renewalRepository.findAllByOrderByEndDateAsc();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Renewal> getById(@PathVariable UUID id) {
        return renewalRepository.findById(id).map(r -> { assertCenter(r); return ResponseEntity.ok(r); })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Scan ACTIVE enrolments ending within {daysAhead} days and create a PENDING renewal for any
     * that don't already have one. Idempotent — safe to run repeatedly (e.g. daily).
     */
    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER','STAFF')")
    public ResponseEntity<Map<String, Object>> generate(@RequestParam(defaultValue = "30") int daysAhead,
                                                        @RequestParam(required = false) UUID centerId) {
        UUID eff = authz.effectiveListCenterId(centerId);
        LocalDate today = LocalDate.now();
        LocalDate until = today.plusDays(Math.max(1, daysAhead));
        List<Enrollment> ending = enrollmentRepository.findByStatusAndEndDateBetween("ACTIVE", today, until);
        int created = 0;
        for (Enrollment e : ending) {
            if (e.getEndDate() == null || e.getId() == null) continue;
            if (renewalRepository.existsByCurrentEnrollmentId(e.getId())) continue;
            ClassEntity cls = (e.getClassId() != null)
                    ? classRepository.findById(e.getClassId()).orElse(null) : null;
            if (eff != null && (cls == null || !eff.equals(cls.getCenterId()))) continue;
            Renewal r = new Renewal();
            r.setStudentId(e.getStudentId());
            r.setCurrentEnrollmentId(e.getId());
            r.setClassId(e.getClassId());
            r.setEndDate(e.getEndDate());
            if (cls != null) {
                r.setCenterId(cls.getCenterId());
                r.setProgramId(cls.getProgramId());
            }
            r.setStatus("PENDING");
            renewalRepository.save(r);
            created++;
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("scanned", ending.size());
        out.put("created", created);
        out.put("daysAhead", daysAhead);
        return ResponseEntity.ok(out);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Renewal> update(@PathVariable UUID id, @Valid @RequestBody Renewal body) {
        return renewalRepository.findById(id).map(r -> {
            assertCenter(r);
            r.setAssignedTo(body.getAssignedTo());
            r.setReminderDate(body.getReminderDate());
            if (body.getNotes() != null) r.setNotes(body.getNotes());
            if (body.getStatus() != null) r.setStatus(body.getStatus());
            return ResponseEntity.ok(renewalRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/contacted")
    public ResponseEntity<Renewal> contacted(@PathVariable UUID id,
                                             @RequestBody(required = false) Map<String, Object> body) {
        return transition(id, "CONTACTED", body);
    }

    @PostMapping("/{id}/renewed")
    public ResponseEntity<Renewal> renewed(@PathVariable UUID id,
                                           @RequestBody(required = false) Map<String, Object> body) {
        Renewal r = require(id);
        r.setStatus("RENEWED");
        if (body != null) {
            if (body.get("renewedEnrollmentId") != null) {
                try {
                    r.setRenewedEnrollmentId(UUID.fromString(body.get("renewedEnrollmentId").toString()));
                } catch (IllegalArgumentException ignored) { /* leave null */ }
            }
            if (body.get("notes") != null) r.setNotes(body.get("notes").toString());
        }
        return ResponseEntity.ok(renewalRepository.save(r));
    }

    @PostMapping("/{id}/declined")
    public ResponseEntity<Renewal> declined(@PathVariable UUID id,
                                            @RequestBody(required = false) Map<String, Object> body) {
        return transition(id, "DECLINED", body);
    }

    @PostMapping("/{id}/churned")
    public ResponseEntity<Renewal> churned(@PathVariable UUID id,
                                           @RequestBody(required = false) Map<String, Object> body) {
        return transition(id, "CHURNED", body);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        return renewalRepository.findById(id).map(r -> {
            assertCenter(r);
            renewalRepository.delete(r);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        long pending = renewalRepository.countByStatus("PENDING");
        long contacted = renewalRepository.countByStatus("CONTACTED");
        long renewed = renewalRepository.countByStatus("RENEWED");
        long declined = renewalRepository.countByStatus("DECLINED");
        long churned = renewalRepository.countByStatus("CHURNED");
        long closed = renewed + declined + churned;
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("pending", pending);
        out.put("contacted", contacted);
        out.put("renewed", renewed);
        out.put("declined", declined);
        out.put("churned", churned);
        out.put("total", pending + contacted + closed);
        out.put("renewalRate", closed > 0 ? Math.round((renewed * 1000.0) / closed) / 10.0 : 0);
        return ResponseEntity.ok(out);
    }

    private ResponseEntity<Renewal> transition(UUID id, String status, Map<String, Object> body) {
        Renewal r = require(id);
        r.setStatus(status);
        if (body != null && body.get("notes") != null) r.setNotes(body.get("notes").toString());
        return ResponseEntity.ok(renewalRepository.save(r));
    }

    private Renewal require(UUID id) {
        Renewal r = renewalRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Renewal not found"));
        assertCenter(r);
        return r;
    }
}
