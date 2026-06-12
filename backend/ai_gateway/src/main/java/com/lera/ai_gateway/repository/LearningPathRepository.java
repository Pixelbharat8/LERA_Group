package com.lera.ai_gateway.repository;

import com.lera.ai_gateway.entity.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, UUID> {
    List<LearningPath> findByStudentId(UUID studentId);
    List<LearningPath> findByStatus(String status);
    List<LearningPath> findByStudentIdAndStatus(UUID studentId, String status);
}
