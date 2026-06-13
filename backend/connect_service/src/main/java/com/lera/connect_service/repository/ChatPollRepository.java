package com.lera.connect_service.repository;

import com.lera.connect_service.entity.ChatPoll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChatPollRepository extends JpaRepository<ChatPoll, UUID> {
    
    List<ChatPoll> findByConversationIdOrderByCreatedAtDesc(UUID conversationId);
    
    List<ChatPoll> findByCreatedBy(UUID userId);
    
    List<ChatPoll> findByIsClosedFalseAndExpiresAtBefore(LocalDateTime now);
    
    List<ChatPoll> findByConversationIdAndIsClosedFalse(UUID conversationId);
}
