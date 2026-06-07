package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Feedback;
import com.lera.academy_service.repository.FeedbackRepository;
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
 * User feedback — now DB-backed (was an in-memory stub that lost data on restart).
 * API paths are unchanged so existing consumers (e.g. centre analytics → /summary) keep working.
 */
@RestController
@RequestMapping("/api/feedback")
@PreAuthorize(AcademyRoles.STAFF)
public class FeedbackController {

    private final FeedbackRepository repository;

    public FeedbackController(FeedbackRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedback(
            @RequestParam(required = false) String centerId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status) {
        UUID center = parseUuid(centerId);
        String cat = blankToNull(category);
        String st = blankToNull(status);
        return ResponseEntity.ok(repository.search(center, cat, st));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getFeedbackSummary(
            @RequestParam(required = false) String centerId) {
        Map<String, Object> summary = new LinkedHashMap<>();
        Double avg = repository.averageRating();
        summary.put("totalFeedback", repository.count());
        summary.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0);
        summary.put("newFeedback", repository.countByStatus("NEW"));
        summary.put("reviewedFeedback", repository.countByStatus("REVIEWED"));
        summary.put("resolvedFeedback", repository.countByStatus("RESOLVED"));
        summary.put("pendingFeedback", repository.countByStatus("PENDING"));

        Map<String, Long> ratingDistribution = new LinkedHashMap<>();
        for (Object[] row : repository.ratingDistribution()) {
            ratingDistribution.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        summary.put("ratingDistribution", ratingDistribution);

        Map<String, Long> categoryBreakdown = new LinkedHashMap<>();
        for (Object[] row : repository.categoryBreakdown()) {
            categoryBreakdown.put(row[0] != null ? row[0].toString() : "Uncategorized",
                    ((Number) row[1]).longValue());
        }
        summary.put("categoryBreakdown", categoryBreakdown);

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Feedback> getFeedbackById(@PathVariable UUID id) {
        return repository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Feedback> createFeedback(@Valid @RequestBody Feedback feedback) {
        feedback.setId(null);
        if (feedback.getStatus() == null) feedback.setStatus("NEW");
        return ResponseEntity.ok(repository.save(feedback));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Feedback> updateFeedback(@PathVariable UUID id, @Valid @RequestBody Feedback body) {
        return repository.findById(id).map(existing -> {
            existing.setCategory(body.getCategory());
            existing.setSubject(body.getSubject());
            existing.setMessage(body.getMessage());
            existing.setRating(body.getRating());
            if (body.getStatus() != null) existing.setStatus(body.getStatus());
            existing.setCenterId(body.getCenterId());
            existing.setReviewedBy(body.getReviewedBy());
            existing.setReviewNotes(body.getReviewNotes());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Feedback> updateFeedbackStatus(@PathVariable UUID id,
                                                         @RequestBody Map<String, Object> request) {
        return repository.findById(id).map(existing -> {
            if (request.get("status") != null) existing.setStatus(request.get("status").toString());
            if (request.get("reviewNotes") != null) existing.setReviewNotes(request.get("reviewNotes").toString());
            if (request.get("reviewedBy") != null) existing.setReviewedBy(request.get("reviewedBy").toString());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable UUID id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Feedback>> getFeedbackByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(repository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<Feedback>> getFeedbackByCenter(@PathVariable UUID centerId) {
        return ResponseEntity.ok(repository.findByCenterIdOrderByCreatedAtDesc(centerId));
    }

    private static UUID parseUuid(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return UUID.fromString(s);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
