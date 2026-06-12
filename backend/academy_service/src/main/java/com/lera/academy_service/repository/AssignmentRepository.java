package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByClassId(UUID classId);
    List<Assignment> findByCreatedBy(Long createdBy);
    List<Assignment> findByModuleId(Long moduleId);
    List<Assignment> findByAssignmentType(String assignmentType);
    List<Assignment> findByClassIdAndAssignmentType(UUID classId, String assignmentType);
    
    // Get assignments for a student based on their enrolled classes
    @Query(value = "SELECT a.* FROM assignments a " +
           "JOIN classes c ON a.class_id = c.id " +
           "JOIN enrollments e ON c.id = e.class_id " +
           "WHERE e.student_id = ?1 AND e.status = 'ACTIVE'", nativeQuery = true)
    List<Assignment> findByStudentId(UUID studentId);
    
    // Get homework for a student
    @Query(value = "SELECT a.* FROM assignments a " +
           "JOIN classes c ON a.class_id = c.id " +
           "JOIN enrollments e ON c.id = e.class_id " +
           "WHERE e.student_id = ?1 AND e.status = 'ACTIVE' AND a.assignment_type = 'HOMEWORK' " +
           "ORDER BY a.due_date ASC", nativeQuery = true)
    List<Assignment> findHomeworkByStudentId(UUID studentId);
    
    // Get assessments (non-homework types)
    @Query(value = "SELECT a.* FROM assignments a " +
           "WHERE a.assignment_type IN ('QUIZ', 'PROJECT', 'EXAM_PREP') " +
           "ORDER BY a.due_date ASC", nativeQuery = true)
    List<Assignment> findAssessments();
    
    // Get assessments by class
    @Query(value = "SELECT a.* FROM assignments a " +
           "WHERE a.class_id = ?1 AND a.assignment_type IN ('QUIZ', 'PROJECT', 'EXAM_PREP') " +
           "ORDER BY a.due_date ASC", nativeQuery = true)
    List<Assignment> findAssessmentsByClassId(UUID classId);

    /**
     * Assignments for classes where this teacher is primary or assistant (UUID ids).
     * Uses cast join so numeric/text class_id in assignments lines up with UUID class PK where needed.
     */
    @Query(value = "SELECT a.* FROM assignments a "
            + "INNER JOIN classes c ON a.class_id = c.id "
            + "WHERE (c.teacher_id = :tid OR c.assistant_teacher_id = :tid)",
            nativeQuery = true)
    List<Assignment> findForTeacherAssignedClasses(@Param("tid") UUID teacherRowId);

    @Query(value = "SELECT a.* FROM assignments a "
            + "INNER JOIN classes c ON a.class_id = c.id "
            + "WHERE (c.teacher_id = :tid OR c.assistant_teacher_id = :tid) "
            + "AND a.assignment_type = 'HOMEWORK' "
            + "ORDER BY a.due_date ASC NULLS LAST", nativeQuery = true)
    List<Assignment> findHomeworkForTeacherClasses(@Param("tid") UUID teacherRowId);

    @Query(value = "SELECT a.* FROM assignments a "
            + "INNER JOIN classes c ON a.class_id = c.id "
            + "WHERE (c.teacher_id = :tid OR c.assistant_teacher_id = :tid) "
            + "AND a.assignment_type IN ('QUIZ', 'PROJECT', 'EXAM_PREP') "
            + "ORDER BY a.due_date ASC NULLS LAST", nativeQuery = true)
    List<Assignment> findAssessmentsForTeacherClasses(@Param("tid") UUID teacherRowId);
}
