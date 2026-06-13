package com.lera.ai_gateway.repository;

import com.lera.ai_gateway.entity.AiRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiRecommendationRepository extends JpaRepository<AiRecommendation, UUID> {
    List<AiRecommendation> findByStudentId(UUID studentId);
    List<AiRecommendation> findByRecommendationType(String recommendationType);
    List<AiRecommendation> findByStatus(String status);
}
