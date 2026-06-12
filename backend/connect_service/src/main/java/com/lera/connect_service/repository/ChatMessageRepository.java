package com.lera.connect_service.repository;

import com.lera.connect_service.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByLeadId(UUID leadId);
    List<ChatMessage> findBySenderId(UUID senderId);
    List<ChatMessage> findByLeadIdOrderBySentAtAsc(UUID leadId);

    @Query("SELECT m FROM ChatMessage m WHERE m.leadId IN :convIds AND m.deletedAt IS NULL "
            + "AND LOWER(m.message) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<ChatMessage> searchInConversations(
            @Param("convIds") Collection<UUID> convIds,
            @Param("q") String q);
    
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.leadId = :leadId AND cm.isRead = false")
    List<ChatMessage> findUnreadMessages(UUID leadId);
    
    List<ChatMessage> findBySentAtBetween(LocalDateTime start, LocalDateTime end);
}
