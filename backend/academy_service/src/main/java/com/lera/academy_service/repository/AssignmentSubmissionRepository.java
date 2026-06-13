package com.lera.academy_service.repository;

import com.lera.academy_service.entity.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, UUID> {
    List<AssignmentSubmission> findByAssignmentId(Long assignmentId);
    List<AssignmentSubmission> findByStudentId(UUID studentId);
    List<AssignmentSubmission> findByAssignmentIdAndStudentId(Long assignmentId, UUID studentId);
    List<AssignmentSubmission> findByStatus(String status);
    long countByAssignmentId(Long assignmentId);
    long countByAssignmentIdAndStatus(Long assignmentId, String status);
}
