package com.lera.connect_service.controller;

import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DocumentController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllDocuments(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, userId);

        List<Map<String, Object>> documents = new ArrayList<>();

        String[] categories = {"ID Proof", "Address Proof", "Educational", "Employment", "Other"};
        String[] types = {"PDF", "Image", "Word", "Excel"};

        for (int i = 1; i <= 8; i++) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("id", UUID.randomUUID().toString());
            doc.put("userId", userId != null ? userId : "user-" + i);
            doc.put("name", "Document " + i);
            doc.put("category", categories[i % categories.length]);
            doc.put("type", types[i % types.length]);
            doc.put("size", (i * 250) + " KB");
            doc.put("sizeBytes", i * 250 * 1024);
            doc.put("url", "/uploads/documents/doc-" + i + ".pdf");
            doc.put("uploadedBy", "user-" + (i % 3 + 1));
            doc.put("uploadedByName", "Uploader " + (i % 3 + 1));
            doc.put("status", i % 3 == 0 ? "PENDING" : i % 3 == 1 ? "VERIFIED" : "APPROVED");
            doc.put("verifiedBy", i % 3 != 0 ? "admin-1" : null);
            doc.put("verifiedAt", i % 3 != 0 ? LocalDateTime.now().minusDays(i) : null);
            doc.put("expiryDate", i % 2 == 0 ? LocalDateTime.now().plusMonths(12).toLocalDate() : null);
            doc.put("createdAt", LocalDateTime.now().minusDays(i * 5));
            doc.put("updatedAt", LocalDateTime.now().minusDays(i));
            documents.add(doc);
        }

        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDocumentById(
            @PathVariable String id,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);

        Map<String, Object> doc = new HashMap<>();
        doc.put("id", id);
        doc.put("userId", "user-1");
        doc.put("name", "Sample Document");
        doc.put("category", "ID Proof");
        doc.put("type", "PDF");
        doc.put("description", "This is a sample document.");
        doc.put("size", "500 KB");
        doc.put("sizeBytes", 512000);
        doc.put("url", "/uploads/documents/" + id + ".pdf");
        doc.put("uploadedBy", "user-1");
        doc.put("uploadedByName", "John Doe");
        doc.put("status", "VERIFIED");
        doc.put("verifiedBy", "admin-1");
        doc.put("verifiedByName", "Admin User");
        doc.put("verifiedAt", LocalDateTime.now().minusDays(5));
        doc.put("notes", "Document verified successfully.");
        doc.put("createdAt", LocalDateTime.now().minusDays(10));
        doc.put("updatedAt", LocalDateTime.now().minusDays(5));

        return ResponseEntity.ok(doc);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);

        Map<String, Object> doc = new HashMap<>(request);
        doc.put("id", UUID.randomUUID().toString());
        doc.put("status", "PENDING");
        doc.put("createdAt", LocalDateTime.now());
        doc.put("updatedAt", LocalDateTime.now());

        return ResponseEntity.ok(doc);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateDocument(
            @PathVariable String id,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);

        Map<String, Object> doc = new HashMap<>(request);
        doc.put("id", id);
        doc.put("updatedAt", LocalDateTime.now());

        return ResponseEntity.ok(doc);
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<Map<String, Object>> verifyDocument(
            @PathVariable String id,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);
        Object verifiedBy = request.get("verifiedBy");
        if (verifiedBy != null) {
            ConnectSecurity.assertActorIsSelf(authUser, verifiedBy.toString());
        }

        Map<String, Object> doc = new HashMap<>();
        doc.put("id", id);
        doc.put("status", "VERIFIED");
        doc.put("verifiedBy", request.get("verifiedBy"));
        doc.put("verifiedAt", LocalDateTime.now());
        doc.put("notes", request.get("notes"));
        doc.put("updatedAt", LocalDateTime.now());

        return ResponseEntity.ok(doc);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectDocument(
            @PathVariable String id,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);
        Object rejectedBy = request.get("rejectedBy");
        if (rejectedBy != null) {
            ConnectSecurity.assertActorIsSelf(authUser, rejectedBy.toString());
        }

        Map<String, Object> doc = new HashMap<>();
        doc.put("id", id);
        doc.put("status", "REJECTED");
        doc.put("rejectedBy", request.get("rejectedBy"));
        doc.put("rejectedAt", LocalDateTime.now());
        doc.put("rejectionReason", request.get("reason"));
        doc.put("updatedAt", LocalDateTime.now());

        return ResponseEntity.ok(doc);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(
            @PathVariable String id,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getDocumentsByUser(
            @PathVariable String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, userId);

        List<Map<String, Object>> documents = new ArrayList<>();

        String[] categories = {"ID Proof", "Address Proof", "Educational"};

        for (int i = 1; i <= 5; i++) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("id", UUID.randomUUID().toString());
            doc.put("userId", userId);
            doc.put("name", "User Document " + i);
            doc.put("category", categories[i % categories.length]);
            doc.put("type", "PDF");
            doc.put("size", (i * 200) + " KB");
            doc.put("url", "/uploads/documents/user-doc-" + i + ".pdf");
            doc.put("status", i % 2 == 0 ? "VERIFIED" : "PENDING");
            doc.put("createdAt", LocalDateTime.now().minusDays(i * 3));
            documents.add(doc);
        }

        return ResponseEntity.ok(documents);
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Map<String, Object>>> getDocumentsByCategory(
            @PathVariable String category,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);

        List<Map<String, Object>> documents = new ArrayList<>();

        for (int i = 1; i <= 4; i++) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("id", UUID.randomUUID().toString());
            doc.put("userId", "user-" + i);
            doc.put("userName", "User " + i);
            doc.put("name", category + " Document " + i);
            doc.put("category", category);
            doc.put("type", "PDF");
            doc.put("size", (i * 300) + " KB");
            doc.put("url", "/uploads/documents/cat-doc-" + i + ".pdf");
            doc.put("status", "VERIFIED");
            doc.put("createdAt", LocalDateTime.now().minusDays(i * 2));
            documents.add(doc);
        }

        return ResponseEntity.ok(documents);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingDocuments(
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);

        List<Map<String, Object>> documents = new ArrayList<>();

        for (int i = 1; i <= 6; i++) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("id", UUID.randomUUID().toString());
            doc.put("userId", "user-" + i);
            doc.put("userName", "User " + i);
            doc.put("name", "Pending Document " + i);
            doc.put("category", i % 2 == 0 ? "ID Proof" : "Address Proof");
            doc.put("type", "PDF");
            doc.put("size", (i * 250) + " KB");
            doc.put("url", "/uploads/documents/pending-" + i + ".pdf");
            doc.put("status", "PENDING");
            doc.put("createdAt", LocalDateTime.now().minusDays(i));
            documents.add(doc);
        }

        return ResponseEntity.ok(documents);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDocumentStats(
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDocuments", 156);
        stats.put("pendingVerification", 12);
        stats.put("verified", 130);
        stats.put("rejected", 8);
        stats.put("expiringSoon", 6);

        Map<String, Integer> byCategory = new HashMap<>();
        byCategory.put("ID Proof", 45);
        byCategory.put("Address Proof", 38);
        byCategory.put("Educational", 35);
        byCategory.put("Employment", 28);
        byCategory.put("Other", 10);
        stats.put("byCategory", byCategory);

        return ResponseEntity.ok(stats);
    }
}
