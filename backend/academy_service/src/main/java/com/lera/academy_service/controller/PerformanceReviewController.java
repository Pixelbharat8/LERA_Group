package com.lera.academy_service.controller;

import com.lera.academy_service.entity.PerformanceReview;
import com.lera.academy_service.repository.PerformanceReviewRepository;
import com.lera.academy_service.security.AcademyRoles;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Staff performance reviews / appraisals. Managers author; employees view & acknowledge. DB-backed.
 */
@RestController
@RequestMapping("/api/performance-reviews")
@PreAuthorize(AcademyRoles.STAFF)
public class PerformanceReviewController {

    private static final String MANAGER_ROLES =
            "hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')";

    private final PerformanceReviewRepository repository;

    public PerformanceReviewController(PerformanceReviewRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize(MANAGER_ROLES)
    public ResponseEntity<List<PerformanceReview>> list(@RequestParam(required = false) String status,
                                                        @RequestParam(required = false) UUID centerId) {
        List<PerformanceReview> result;
        if (centerId != null) result = repository.findByCenterIdOrderByReviewDateDesc(centerId);
        else if (status != null && !status.isBlank()) result = repository.findByStatusOrderByReviewDateDesc(status);
        else result = repository.findAllByOrderByReviewDateDesc();
        return ResponseEntity.ok(result);
    }

    /** Reviews about me (employee self-view). */
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<PerformanceReview>> byEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(repository.findByEmployeeIdOrderByReviewDateDesc(employeeId));
    }

    /** Reviews I authored (reviewer/manager). */
    @GetMapping("/reviewer/{reviewerId}")
    public ResponseEntity<List<PerformanceReview>> byReviewer(@PathVariable UUID reviewerId) {
        return ResponseEntity.ok(repository.findByReviewerIdOrderByReviewDateDesc(reviewerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PerformanceReview> getById(@PathVariable UUID id) {
        return repository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize(MANAGER_ROLES)
    public ResponseEntity<PerformanceReview> create(@Valid @RequestBody PerformanceReview body) {
        body.setId(null);
        return ResponseEntity.ok(repository.save(body));
    }

    @PutMapping("/{id}")
    @PreAuthorize(MANAGER_ROLES)
    public ResponseEntity<PerformanceReview> update(@PathVariable UUID id, @Valid @RequestBody PerformanceReview body) {
        return repository.findById(id).map(p -> {
            p.setPeriod(body.getPeriod());
            p.setReviewDate(body.getReviewDate());
            p.setOverallRating(body.getOverallRating());
            p.setStrengths(body.getStrengths());
            p.setImprovements(body.getImprovements());
            p.setGoals(body.getGoals());
            p.setReviewerId(body.getReviewerId());
            p.setReviewerName(body.getReviewerName());
            if (body.getStatus() != null) p.setStatus(body.getStatus());
            return ResponseEntity.ok(repository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize(MANAGER_ROLES)
    public ResponseEntity<PerformanceReview> submit(@PathVariable UUID id) {
        return setStatus(id, "SUBMITTED");
    }

    /** Employee acknowledges they've read the review. */
    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<PerformanceReview> acknowledge(@PathVariable UUID id) {
        return setStatus(id, "ACKNOWLEDGED");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(MANAGER_ROLES)
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    @PreAuthorize(MANAGER_ROLES)
    public ResponseEntity<Map<String, Object>> stats() {
        Double avg = repository.averageRating();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("draft", repository.countByStatus("DRAFT"));
        out.put("submitted", repository.countByStatus("SUBMITTED"));
        out.put("acknowledged", repository.countByStatus("ACKNOWLEDGED"));
        out.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0);
        return ResponseEntity.ok(out);
    }

    private ResponseEntity<PerformanceReview> setStatus(UUID id, String status) {
        return repository.findById(id).map(p -> {
            p.setStatus(status);
            return ResponseEntity.ok(repository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }
}
