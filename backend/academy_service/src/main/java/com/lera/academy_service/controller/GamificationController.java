package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.StudentPoints;
import com.lera.academy_service.entity.PointTransaction;
import com.lera.academy_service.repository.StudentPointsRepository;
import com.lera.academy_service.repository.PointTransactionRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class GamificationController {
    
    private final StudentPointsRepository studentPointsRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final AcademyAuthorizationService authz;

    @GetMapping("/leaderboard")
    public ResponseEntity<List<StudentPoints>> getLeaderboard() {
        return ResponseEntity.ok(studentPointsRepository.findTopStudents());
    }
    
    @GetMapping("/leaderboard/center/{centerId}")
    public ResponseEntity<List<StudentPoints>> getLeaderboardByCenter(@PathVariable UUID centerId) {
        return ResponseEntity.ok(studentPointsRepository.findTopStudentsByCenter(centerId));
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<StudentPoints> getStudentPoints(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return studentPointsRepository.findByStudentId(studentId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    // Create new record if not exists
                    StudentPoints newPoints = StudentPoints.builder()
                            .studentId(studentId)
                            .totalPoints(0)
                            .currentLevel(1)
                            .build();
                    return ResponseEntity.ok(studentPointsRepository.save(newPoints));
                });
    }
    
    @GetMapping("/student/{studentId}/transactions")
    public ResponseEntity<List<PointTransaction>> getStudentTransactions(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(pointTransactionRepository.findByStudentIdOrderByCreatedAtDesc(studentId));
    }
    
    @PostMapping("/award")
    public ResponseEntity<PointTransaction> awardPoints(@Valid @RequestBody Map<String, Object> body) {
        UUID studentId = UUID.fromString((String) body.get("studentId"));
        authz.assertCanViewStudent(studentId);
        int points = (Integer) body.get("points");
        String reason = (String) body.get("reason");
        String description = (String) body.get("description");
        UUID awardedBy = body.get("awardedBy") != null ? UUID.fromString((String) body.get("awardedBy")) : null;
        
        // Update student points
        StudentPoints studentPoints = studentPointsRepository.findByStudentId(studentId)
                .orElseGet(() -> StudentPoints.builder().studentId(studentId).totalPoints(0).currentLevel(1).build());
        
        studentPoints.setTotalPoints(studentPoints.getTotalPoints() + points);
        studentPoints.setLastActivityDate(LocalDateTime.now());
        
        // Update level based on points
        int newLevel = calculateLevel(studentPoints.getTotalPoints());
        studentPoints.setCurrentLevel(newLevel);
        
        studentPointsRepository.save(studentPoints);
        
        // Create transaction record
        PointTransaction transaction = PointTransaction.builder()
                .studentId(studentId)
                .points(points)
                .transactionType("EARNED")
                .reason(reason)
                .description(description)
                .awardedBy(awardedBy)
                .build();
        
        return ResponseEntity.ok(pointTransactionRepository.save(transaction));
    }
    
    @PostMapping("/deduct")
    public ResponseEntity<PointTransaction> deductPoints(@Valid @RequestBody Map<String, Object> body) {
        UUID studentId = UUID.fromString((String) body.get("studentId"));
        authz.assertCanViewStudent(studentId);
        int points = (Integer) body.get("points");
        String reason = (String) body.get("reason");
        String description = (String) body.get("description");

        StudentPoints studentPoints = studentPointsRepository.findByStudentId(studentId)
                .orElse(null);
        
        if (studentPoints == null) {
            return ResponseEntity.badRequest().build();
        }
        
        studentPoints.setTotalPoints(Math.max(0, studentPoints.getTotalPoints() - points));
        studentPoints.setLastActivityDate(LocalDateTime.now());
        studentPointsRepository.save(studentPoints);
        
        PointTransaction transaction = PointTransaction.builder()
                .studentId(studentId)
                .points(-points)
                .transactionType("SPENT")
                .reason(reason)
                .description(description)
                .build();
        
        return ResponseEntity.ok(pointTransactionRepository.save(transaction));
    }
    
    private int calculateLevel(int totalPoints) {
        if (totalPoints >= 10000) return 10;
        if (totalPoints >= 7500) return 9;
        if (totalPoints >= 5000) return 8;
        if (totalPoints >= 3500) return 7;
        if (totalPoints >= 2500) return 6;
        if (totalPoints >= 1500) return 5;
        if (totalPoints >= 1000) return 4;
        if (totalPoints >= 500) return 3;
        if (totalPoints >= 200) return 2;
        return 1;
    }
}
