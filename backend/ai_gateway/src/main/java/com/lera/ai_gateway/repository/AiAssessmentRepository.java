package com.lera.ai_gateway.repository;

import com.lera.ai_gateway.entity.AiAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiAssessmentRepository extends JpaRepository<AiAssessment, UUID> {
    List<AiAssessment> findByStudentId(UUID studentId);
    List<AiAssessment> findByAssessmentType(String assessmentType);
    List<AiAssessment> findBySubject(String subject);
    List<AiAssessment> findByStudentIdAndSubject(UUID studentId, String subject);
}
