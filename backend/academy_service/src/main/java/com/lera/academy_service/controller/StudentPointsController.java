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
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    /**
     * A StudentPoints row carries only studentId, so the leaderboard showed a truncated UUID where
     * the student's name belongs, and searching by name matched nothing. Resolve the names in one
     * query, the way ClassController#withDisplayNames does.
     */
    private List<java.util.Map<String, Object>> withStudentNames(List<StudentPoints> rows) {
        if (rows.isEmpty()) return List.of();
        List<UUID> ids = rows.stream().map(StudentPoints::getStudentId)
                .filter(java.util.Objects::nonNull).distinct().toList();
        java.util.Map<UUID, String> names = new java.util.HashMap<>();
        if (!ids.isEmpty()) {
            String ph = ids.stream().map(x -> "?").collect(java.util.stream.Collectors.joining(","));
            jdbcTemplate.query("SELECT id, fullname FROM students WHERE id IN (" + ph + ")",
                    (java.sql.ResultSet rs) -> {
                        names.put(rs.getObject("id", UUID.class), rs.getString("fullname"));
                    }, ids.toArray());
        }
        List<java.util.Map<String, Object>> out = new java.util.ArrayList<>();
        for (StudentPoints r : rows) {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("studentId", r.getStudentId());
            m.put("studentName", names.get(r.getStudentId()));
            m.put("centerId", r.getCenterId());
            m.put("totalPoints", r.getTotalPoints());
            m.put("currentLevel", r.getCurrentLevel());
            m.put("currentStreak", r.getCurrentStreak());
            m.put("longestStreak", r.getLongestStreak());
            m.put("badgesEarned", r.getBadgesEarned());
            m.put("lastActivityDate", r.getLastActivityDate());
            out.add(m);
        }
        return out;
    }
    
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
    public ResponseEntity<List<java.util.Map<String, Object>>> getLeaderboardByCenter(@PathVariable UUID centerId) {
        authz.assertStaffOrCenter(centerId);
        return ResponseEntity.ok(withStudentNames(
                studentPointsRepository.findByCenterIdOrderByTotalPointsDesc(centerId)));
    }
    
    @GetMapping("/leaderboard")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<java.util.Map<String, Object>>> getGlobalLeaderboard() {
        return ResponseEntity.ok(withStudentNames(studentPointsRepository.findTopStudents()));
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
