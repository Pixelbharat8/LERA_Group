package com.lera.ai_gateway.repository;

import com.lera.ai_gateway.entity.AiLearningProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiLearningProgressRepository extends JpaRepository<AiLearningProgress, UUID> {
    List<AiLearningProgress> findByStudentId(UUID studentId);
    List<AiLearningProgress> findByStudentIdAndSubject(UUID studentId, String subject);
}
