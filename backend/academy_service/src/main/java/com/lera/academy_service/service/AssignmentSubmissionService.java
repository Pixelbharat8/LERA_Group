package com.lera.academy_service.service;

import com.lera.academy_service.entity.AssignmentSubmission;
import com.lera.academy_service.repository.AssignmentSubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AssignmentSubmissionService {

    private final AssignmentSubmissionRepository assignmentSubmissionRepository;

    public AssignmentSubmission createSubmission(AssignmentSubmission submission) {
        Objects.requireNonNull(submission, "submission must not be null");
        return Objects.requireNonNull(assignmentSubmissionRepository.save(submission));
    }

    public Optional<AssignmentSubmission> getSubmissionById(UUID id) {
        Objects.requireNonNull(id, "id must not be null");
        return assignmentSubmissionRepository.findById(id);
    }

    public List<AssignmentSubmission> getSubmissionsByAssignment(Long assignmentId) {
        Objects.requireNonNull(assignmentId, "assignmentId must not be null");
        return assignmentSubmissionRepository.findByAssignmentId(assignmentId);
    }

    public List<AssignmentSubmission> getSubmissionsByStudent(UUID studentId) {
        Objects.requireNonNull(studentId, "studentId must not be null");
        return assignmentSubmissionRepository.findByStudentId(studentId);
    }

    public AssignmentSubmission gradeSubmission(UUID id, Integer score, String feedback) {
        Objects.requireNonNull(id, "id must not be null");
        AssignmentSubmission submission = assignmentSubmissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        submission.setScore(score);
        submission.setFeedback(feedback);
        submission.setStatus("GRADED");

        return Objects.requireNonNull(assignmentSubmissionRepository.save(submission));
    }

    public void deleteSubmission(UUID id) {
        Objects.requireNonNull(id, "id must not be null");
        assignmentSubmissionRepository.deleteById(id);
    }
}
