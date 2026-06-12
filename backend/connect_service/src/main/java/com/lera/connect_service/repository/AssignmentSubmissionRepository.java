package com.lera.connect_service.repository;

import com.lera.connect_service.entity.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, UUID> {
    
    List<AssignmentSubmission> findByAssignmentId(UUID assignmentId);
    
    List<AssignmentSubmission> findByStudentId(UUID studentId);
    
    Optional<AssignmentSubmission> findByAssignmentIdAndStudentId(UUID assignmentId, UUID studentId);
    
    @Query("SELECT s FROM AssignmentSubmission s WHERE s.assignmentId = :aId AND s.status = :status")
    List<AssignmentSubmission> findByAssignmentAndStatus(@Param("aId") UUID assignmentId, @Param("status") String status);
    
    @Query("SELECT COUNT(s) FROM AssignmentSubmission s WHERE s.assignmentId = :aId")
    long countByAssignment(@Param("aId") UUID assignmentId);
    
    @Query("SELECT COUNT(s) FROM AssignmentSubmission s WHERE s.assignmentId = :aId AND s.status = 'GRADED'")
    long countGradedByAssignment(@Param("aId") UUID assignmentId);
    
    List<AssignmentSubmission> findByIsLateTrue();
    
    @Query("SELECT s FROM AssignmentSubmission s WHERE s.gradedById = :teacherId ORDER BY s.gradedAt DESC")
    List<AssignmentSubmission> findGradedByTeacher(@Param("teacherId") UUID teacherId);
}
