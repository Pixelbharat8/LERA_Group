package com.lera.ai_gateway.repository;

import com.lera.ai_gateway.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, UUID> {
    List<AiConversation> findByUserId(UUID userId);
    List<AiConversation> findByStudentId(UUID studentId);
    List<AiConversation> findByConversationType(String conversationType);
    List<AiConversation> findBySubject(String subject);
}
