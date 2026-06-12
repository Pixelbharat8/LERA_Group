package com.lera.connect_service.repository;

import com.lera.connect_service.entity.ChatMessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatMessageReactionRepository extends JpaRepository<ChatMessageReaction, UUID> {
    
    List<ChatMessageReaction> findByMessageId(UUID messageId);
    
    Optional<ChatMessageReaction> findByMessageIdAndUserIdAndEmoji(UUID messageId, UUID userId, String emoji);
    
    void deleteByMessageIdAndUserIdAndEmoji(UUID messageId, UUID userId, String emoji);
    
    boolean existsByMessageIdAndUserIdAndEmoji(UUID messageId, UUID userId, String emoji);
    
    long countByMessageIdAndEmoji(UUID messageId, String emoji);
    
    @Query("SELECT r.emoji, COUNT(r) FROM ChatMessageReaction r WHERE r.messageId = :messageId GROUP BY r.emoji ORDER BY COUNT(r) DESC")
    List<Object[]> getReactionCountsByMessage(@Param("messageId") UUID messageId);
    
    void deleteByMessageId(UUID messageId);
}
