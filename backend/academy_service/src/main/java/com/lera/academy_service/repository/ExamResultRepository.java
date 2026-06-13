package com.lera.academy_service.repository;

import com.lera.academy_service.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, UUID> {
    
    List<ExamResult> findByExamId(UUID examId);
    
    List<ExamResult> findByStudentId(UUID studentId);
    
    Optional<ExamResult> findByExamIdAndStudentId(UUID examId, UUID studentId);
    
    List<ExamResult> findByGradedBy(UUID gradedBy);
    
    List<ExamResult> findByPassed(Boolean passed);
}
