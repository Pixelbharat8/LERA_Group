package com.lera.identity_service.controller;

import com.lera.identity_service.security.AuthUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/approvals")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class ApprovalController {

    /**
     * Who is acting, taken from the token rather than the request body.
     *
     * Every identity on this controller — approvedBy, rejectedBy, and a comment's author — used
     * to be whatever the caller typed. Approve and reject are limited to management roles, so
     * only a manager could approve; but any of them could record the approval under a
     * colleague's name. Adding a comment is open to every role including STUDENT and PARENT, so
     * anyone could post one signed "Chairman". An approval trail that accepts its own
     * attribution from the client records nothing worth having.
     */
    private static String actor(AuthUser user) {
        return user != null && user.getUserId() != null ? user.getUserId().toString() : "unknown";
    }

    // In-memory approval store. NOTE: this is process-local and NOT persisted across restarts —
    // a real ApprovalRequest entity/repository is still needed for production durability. It no
    // longer seeds fabricated sample approvals (previously "John Teacher"/"Sarah Staff" demo rows,
    // which violated the no-fake-data rule); it starts empty and only holds requests created at
    // runtime via POST /api/approvals.
    private final Map<String, Map<String, Object>> approvalRequests = new java.util.concurrent.ConcurrentHashMap<>();

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllApprovals() {
        return ResponseEntity.ok(new ArrayList<>(approvalRequests.values()));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingApprovals() {
        List<Map<String, Object>> pending = approvalRequests.values().stream()
            .filter(r -> "PENDING".equals(r.get("status")))
            .toList();
        return ResponseEntity.ok(pending);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getApprovalHistory() {
        List<Map<String, Object>> history = approvalRequests.values().stream()
            .filter(r -> !"PENDING".equals(r.get("status")))
            .toList();
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getApprovalById(@PathVariable String id) {
        Map<String, Object> request = approvalRequests.get(id);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(request);
    }

    // Creating approval requests is staff workflow — gated to staff+ (not students/parents).
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF')")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createApprovalRequest(@Valid @RequestBody Map<String, Object> body) {
        String id = "apr-" + UUID.randomUUID().toString().substring(0, 8);
        body.put("id", id);
        body.put("status", "PENDING");
        body.put("createdAt", LocalDateTime.now());
        body.put("comments", new ArrayList<>());
        approvalRequests.put(id, body);
        return ResponseEntity.ok(body);
    }

    // Approving/rejecting is a management decision — not the requester's own roles.
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveRequest(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal AuthUser authUser) {
        Map<String, Object> request = approvalRequests.get(id);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        request.put("status", "APPROVED");
        request.put("approvedAt", LocalDateTime.now());
        request.put("approvedBy", actor(authUser));
        if (body != null && body.get("comment") != null) {
            @SuppressWarnings("unchecked")
            List<Object> comments = (List<Object>) request.get("comments");
            Map<String, Object> comment = new HashMap<>();
            comment.put("text", body.get("comment"));
            comment.put("by", actor(authUser));
            comment.put("at", LocalDateTime.now());
            comments.add(comment);
        }
        return ResponseEntity.ok(request);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectRequest(
            @PathVariable String id,
            @Valid @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal AuthUser authUser) {
        Map<String, Object> request = approvalRequests.get(id);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        request.put("status", "REJECTED");
        request.put("rejectedAt", LocalDateTime.now());
        request.put("rejectedBy", actor(authUser));
        request.put("rejectionReason", body.get("reason"));
        return ResponseEntity.ok(request);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable String id,
            @Valid @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal AuthUser authUser) {
        Map<String, Object> request = approvalRequests.get(id);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        @SuppressWarnings("unchecked")
        List<Object> comments = (List<Object>) request.get("comments");
        Map<String, Object> comment = new HashMap<>();
        comment.put("id", UUID.randomUUID().toString());
        comment.put("text", body.get("text"));
        comment.put("by", actor(authUser));
        comment.put("at", LocalDateTime.now());
        comments.add(comment);
        return ResponseEntity.ok(request);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getApprovalStats() {
        long pending = approvalRequests.values().stream()
            .filter(r -> "PENDING".equals(r.get("status"))).count();
        long approved = approvalRequests.values().stream()
            .filter(r -> "APPROVED".equals(r.get("status"))).count();
        long rejected = approvalRequests.values().stream()
            .filter(r -> "REJECTED".equals(r.get("status"))).count();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", approvalRequests.size());
        stats.put("pending", pending);
        stats.put("approved", approved);
        stats.put("rejected", rejected);
        stats.put("byType", Map.of(
            "LEAVE_REQUEST", approvalRequests.values().stream().filter(r -> "LEAVE_REQUEST".equals(r.get("type"))).count(),
            "EXPENSE_CLAIM", approvalRequests.values().stream().filter(r -> "EXPENSE_CLAIM".equals(r.get("type"))).count(),
            "NEW_STUDENT", approvalRequests.values().stream().filter(r -> "NEW_STUDENT".equals(r.get("type"))).count()
        ));
        return ResponseEntity.ok(stats);
    }

    // Deleting an approval (destroying its trail) is an admin action — never students/parents/teachers.
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApprovalRequest(@PathVariable String id) {
        if (approvalRequests.remove(id) != null) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
