package com.lera.academy_service.controller;

import com.lera.academy_service.entity.StudentPoints;
import com.lera.academy_service.repository.StudentPointsRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.service.JdbcAuditWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/student-points")
@RequiredArgsConstructor
public class StudentPointsController {
    
    private final StudentPointsRepository studentPointsRepository;
    private final JdbcAuditWriter auditWriter;
    private final AcademyAuthorizationService authz;
    
    @GetMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<StudentPoints>> getAllPoints(Pageable pageable) {
        return ResponseEntity.ok(studentPointsRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<StudentPoints> getPointsById(@PathVariable UUID id) {
        return studentPointsRepository.findById(id)
                .map(p -> {
                    authz.assertCanViewStudent(p.getStudentId());
                    return ResponseEntity.ok(p);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<StudentPoints> getPointsByStudent(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return studentPointsRepository.findByStudentId(studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/center/{centerId}/leaderboard")
    public ResponseEntity<List<StudentPoints>> getLeaderboardByCenter(@PathVariable UUID centerId) {
        authz.assertStaffOrCenter(centerId);
        return ResponseEntity.ok(studentPointsRepository.findByCenterIdOrderByTotalPointsDesc(centerId));
    }
    
    @GetMapping("/leaderboard")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<StudentPoints>> getGlobalLeaderboard() {
        return ResponseEntity.ok(studentPointsRepository.findTopStudents());
    }
    
    @GetMapping("/center/{centerId}/top")
    public ResponseEntity<List<StudentPoints>> getTopStudentsByCenter(@PathVariable UUID centerId) {
        authz.assertStaffOrCenter(centerId);
        return ResponseEntity.ok(studentPointsRepository.findTopStudentsByCenter(centerId));
    }
    
    @PostMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<StudentPoints> createPoints(@Valid @RequestBody StudentPoints points) {
        return ResponseEntity.ok(studentPointsRepository.save(points));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<StudentPoints> updatePoints(@PathVariable UUID id, @Valid @RequestBody StudentPoints pointsDetails) {
        return studentPointsRepository.findById(id).map(points -> {
            if (pointsDetails.getTotalPoints() != null) points.setTotalPoints(pointsDetails.getTotalPoints());
            if (pointsDetails.getCurrentStreak() != null) points.setCurrentStreak(pointsDetails.getCurrentStreak());
            if (pointsDetails.getLongestStreak() != null) points.setLongestStreak(pointsDetails.getLongestStreak());
            return ResponseEntity.ok(studentPointsRepository.save(points));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/student/{studentId}/add")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<StudentPoints> addPoints(
            @PathVariable UUID studentId,
            @RequestParam Integer points,
            @RequestParam(required = false) String reason) {
        authz.assertCanViewStudent(studentId);
        return studentPointsRepository.findByStudentId(studentId).map(sp -> {
            int oldTotal = sp.getTotalPoints();
            sp.setTotalPoints(oldTotal + points);
            StudentPoints saved = studentPointsRepository.save(sp);
            auditWriter.log("STUDENT_POINTS_AWARDED", "StudentPoints", sp.getId(), null,
                    "{\"totalPoints\":" + oldTotal + "}",
                    "{\"totalPoints\":" + saved.getTotalPoints() +
                    ",\"delta\":" + points +
                    (reason != null ? ",\"reason\":\"" + reason.replace("\"", "\\\"") + "\"" : "") +
                    "}");
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/student/{studentId}/deduct")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<StudentPoints> deductPoints(
            @PathVariable UUID studentId,
            @RequestParam Integer points,
            @RequestParam(required = false) String reason) {
        authz.assertCanViewStudent(studentId);
        return studentPointsRepository.findByStudentId(studentId).map(sp -> {
            int oldTotal = sp.getTotalPoints();
            int newTotal = Math.max(0, oldTotal - Math.abs(points));
            sp.setTotalPoints(newTotal);
            StudentPoints saved = studentPointsRepository.save(sp);
            auditWriter.log("STUDENT_POINTS_DEDUCTED", "StudentPoints", sp.getId(), null,
                    "{\"totalPoints\":" + oldTotal + "}",
                    "{\"totalPoints\":" + newTotal +
                    ",\"delta\":-" + Math.abs(points) +
                    (reason != null ? ",\"reason\":\"" + reason.replace("\"", "\\\"") + "\"" : "") +
                    "}");
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Void> deletePoints(@PathVariable UUID id) {
        if (studentPointsRepository.existsById(id)) {
            studentPointsRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
