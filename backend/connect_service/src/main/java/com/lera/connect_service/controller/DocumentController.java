package com.lera.connect_service.controller;

import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.*;

/**
 * Document management. There is no document storage backend in Connect (no entity/repository and
 * no file store), so this controller previously FABRICATED documents and stats (totalDocuments=156,
 * fake rows, /uploads/... URLs) and silently dropped uploads. All fabrication removed: reads return
 * honestly empty and writes return 501 until a real document store is implemented. Student/teacher
 * document storage that does exist lives in academy_service (StudentDocument/TeacherDocument).
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DocumentController {

    private static final String NOT_IMPLEMENTED =
            "Document storage is not implemented in Connect yet; no document was persisted.";

    private ResponseEntity<Map<String, Object>> notImplemented() {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of("error", NOT_IMPLEMENTED));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllDocuments(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, userId);
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDocumentById(
            @PathVariable String id,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);
        return notImplemented();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateDocument(
            @PathVariable String id,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);
        return notImplemented();
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<Map<String, Object>> verifyDocument(
            @PathVariable String id,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);
        return notImplemented();
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectDocument(
            @PathVariable String id,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);
        return notImplemented();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(
            @PathVariable String id,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);
        return notImplemented();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getDocumentsByUser(
            @PathVariable String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, userId);
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Map<String, Object>>> getDocumentsByCategory(
            @PathVariable String category,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingDocuments(
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDocumentStats(
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDocuments", 0);
        stats.put("pendingVerification", 0);
        stats.put("verified", 0);
        stats.put("rejected", 0);
        stats.put("expiringSoon", 0);
        stats.put("byCategory", Map.of());
        stats.put("note", NOT_IMPLEMENTED);
        return ResponseEntity.ok(stats);
    }
}
