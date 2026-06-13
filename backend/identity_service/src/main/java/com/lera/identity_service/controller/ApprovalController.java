package com.lera.identity_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/approvals")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class ApprovalController {

    // In-memory storage for demo (replace with proper service/repository in production)
    private final Map<String, Map<String, Object>> approvalRequests = new HashMap<>();
    
    public ApprovalController() {
        // Add some sample data
        initSampleData();
    }

    private void initSampleData() {
        Map<String, Object> request1 = new HashMap<>();
        request1.put("id", "apr-001");
        request1.put("type", "LEAVE_REQUEST");
        request1.put("title", "Annual Leave Request");
        request1.put("description", "Request for 5 days annual leave");
        request1.put("requesterId", "user-001");
        request1.put("requesterName", "John Teacher");
        request1.put("status", "PENDING");
        request1.put("priority", "NORMAL");
        request1.put("createdAt", LocalDateTime.now().minusDays(2));
        request1.put("comments", new ArrayList<>());
        approvalRequests.put("apr-001", request1);

        Map<String, Object> request2 = new HashMap<>();
        request2.put("id", "apr-002");
        request2.put("type", "EXPENSE_CLAIM");
        request2.put("title", "Training Materials Expense");
        request2.put("description", "Purchase of teaching materials - $150");
        request2.put("requesterId", "user-002");
        request2.put("requesterName", "Sarah Staff");
        request2.put("status", "PENDING");
        request2.put("priority", "HIGH");
        request2.put("createdAt", LocalDateTime.now().minusDays(1));
        request2.put("comments", new ArrayList<>());
        approvalRequests.put("apr-002", request2);

        Map<String, Object> request3 = new HashMap<>();
        request3.put("id", "apr-003");
        request3.put("type", "NEW_STUDENT");
        request3.put("title", "New Student Registration");
        request3.put("description", "New student enrollment for LERA Starters program");
        request3.put("requesterId", "user-003");
        request3.put("requesterName", "Reception Staff");
        request3.put("status", "APPROVED");
        request3.put("priority", "NORMAL");
        request3.put("createdAt", LocalDateTime.now().minusDays(5));
        request3.put("approvedAt", LocalDateTime.now().minusDays(4));
        request3.put("approvedBy", "Manager");
        request3.put("comments", new ArrayList<>());
        approvalRequests.put("apr-003", request3);
    }

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

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveRequest(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> request = approvalRequests.get(id);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        request.put("status", "APPROVED");
        request.put("approvedAt", LocalDateTime.now());
        request.put("approvedBy", body != null ? body.get("approvedBy") : "System");
        if (body != null && body.get("comment") != null) {
            @SuppressWarnings("unchecked")
            List<Object> comments = (List<Object>) request.get("comments");
            Map<String, Object> comment = new HashMap<>();
            comment.put("text", body.get("comment"));
            comment.put("by", body.get("approvedBy"));
            comment.put("at", LocalDateTime.now());
            comments.add(comment);
        }
        return ResponseEntity.ok(request);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectRequest(
            @PathVariable String id,
            @Valid @RequestBody Map<String, Object> body) {
        Map<String, Object> request = approvalRequests.get(id);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        request.put("status", "REJECTED");
        request.put("rejectedAt", LocalDateTime.now());
        request.put("rejectedBy", body.get("rejectedBy"));
        request.put("rejectionReason", body.get("reason"));
        return ResponseEntity.ok(request);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable String id,
            @Valid @RequestBody Map<String, Object> body) {
        Map<String, Object> request = approvalRequests.get(id);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        @SuppressWarnings("unchecked")
        List<Object> comments = (List<Object>) request.get("comments");
        Map<String, Object> comment = new HashMap<>();
        comment.put("id", UUID.randomUUID().toString());
        comment.put("text", body.get("text"));
        comment.put("by", body.get("by"));
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApprovalRequest(@PathVariable String id) {
        if (approvalRequests.remove(id) != null) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
