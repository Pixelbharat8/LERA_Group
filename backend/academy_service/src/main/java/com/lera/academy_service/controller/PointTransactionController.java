package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.entity.PointTransaction;
import com.lera.academy_service.repository.PointTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/point-transactions")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class PointTransactionController {
    
    private final PointTransactionRepository pointTransactionRepository;
    private final AcademyAuthorizationService authz;

    @GetMapping
    public ResponseEntity<List<PointTransaction>> getAllTransactions(Pageable pageable) {
        return ResponseEntity.ok(pointTransactionRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PointTransaction> getTransactionById(@PathVariable UUID id) {
        return pointTransactionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<PointTransaction>> getTransactionsByStudent(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(pointTransactionRepository.findByStudentIdOrderByCreatedAtDesc(studentId));
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<PointTransaction>> getTransactionsByType(@PathVariable String type) {
        return ResponseEntity.ok(pointTransactionRepository.findByTransactionTypeOrderByCreatedAtDesc(type));
    }
    
    @GetMapping("/reason/{reason}")
    public ResponseEntity<List<PointTransaction>> getTransactionsByReason(@PathVariable String reason) {
        return ResponseEntity.ok(pointTransactionRepository.findByReasonOrderByCreatedAtDesc(reason));
    }
    
    @PostMapping
    public ResponseEntity<PointTransaction> createTransaction(@Valid @RequestBody PointTransaction transaction) {
        return ResponseEntity.ok(pointTransactionRepository.save(transaction));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable UUID id) {
        if (pointTransactionRepository.existsById(id)) {
            pointTransactionRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
