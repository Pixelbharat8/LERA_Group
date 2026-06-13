package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.entity.AssignmentSubmission;
import com.lera.academy_service.repository.AssignmentSubmissionRepository;
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
@RequestMapping("/api/assignment-submissions")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class AssignmentSubmissionController {
    
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final AcademyAuthorizationService authz;

    @GetMapping
    public ResponseEntity<List<AssignmentSubmission>> getAllSubmissions(Pageable pageable) {
        return ResponseEntity.ok(assignmentSubmissionRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AssignmentSubmission> getSubmissionById(@PathVariable UUID id) {
        return assignmentSubmissionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<List<AssignmentSubmission>> getSubmissionsByAssignment(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(assignmentSubmissionRepository.findByAssignmentId(assignmentId));
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AssignmentSubmission>> getSubmissionsByStudent(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(assignmentSubmissionRepository.findByStudentId(studentId));
    }
    
    @GetMapping("/assignment/{assignmentId}/student/{studentId}")
    public ResponseEntity<List<AssignmentSubmission>> getSubmissionsByAssignmentAndStudent(
            @PathVariable Long assignmentId, @PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(assignmentSubmissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<AssignmentSubmission>> getSubmissionsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(assignmentSubmissionRepository.findByStatus(status));
    }
    
    @GetMapping("/assignment/{assignmentId}/count")
    public ResponseEntity<Long> countSubmissions(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(assignmentSubmissionRepository.countByAssignmentId(assignmentId));
    }
    
    @GetMapping("/assignment/{assignmentId}/status/{status}/count")
    public ResponseEntity<Long> countSubmissionsByStatus(@PathVariable Long assignmentId, @PathVariable String status) {
        return ResponseEntity.ok(assignmentSubmissionRepository.countByAssignmentIdAndStatus(assignmentId, status));
    }
    
    @PostMapping
    public ResponseEntity<AssignmentSubmission> createSubmission(@Valid @RequestBody AssignmentSubmission submission) {
        return ResponseEntity.ok(assignmentSubmissionRepository.save(submission));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AssignmentSubmission> updateSubmission(@PathVariable UUID id, @Valid @RequestBody AssignmentSubmission submissionDetails) {
        return assignmentSubmissionRepository.findById(id).map(submission -> {
            if (submissionDetails.getSubmissionText() != null) submission.setSubmissionText(submissionDetails.getSubmissionText());
            if (submissionDetails.getAttachmentUrl() != null) submission.setAttachmentUrl(submissionDetails.getAttachmentUrl());
            if (submissionDetails.getStatus() != null) submission.setStatus(submissionDetails.getStatus());
            if (submissionDetails.getScore() != null) submission.setScore(submissionDetails.getScore());
            if (submissionDetails.getFeedback() != null) submission.setFeedback(submissionDetails.getFeedback());
            return ResponseEntity.ok(assignmentSubmissionRepository.save(submission));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/grade")
    public ResponseEntity<AssignmentSubmission> gradeSubmission(@PathVariable UUID id, 
            @RequestParam Integer score, @RequestParam(required = false) String feedback) {
        return assignmentSubmissionRepository.findById(id).map(submission -> {
            submission.setScore(score);
            if (feedback != null) submission.setFeedback(feedback);
            submission.setStatus("GRADED");
            return ResponseEntity.ok(assignmentSubmissionRepository.save(submission));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubmission(@PathVariable UUID id) {
        if (assignmentSubmissionRepository.existsById(id)) {
            assignmentSubmissionRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
