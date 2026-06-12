package com.lera.connect_service.repository;

import com.lera.connect_service.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    
    @Query("SELECT c FROM Conversation c WHERE :participantId MEMBER OF c.participantIds AND c.isActive = true ORDER BY c.lastMessageAt DESC")
    List<Conversation> findByParticipantId(UUID participantId);
    
    List<Conversation> findByGroupId(UUID groupId);
    
    @Query("SELECT c FROM Conversation c WHERE c.conversationType = 'DIRECT' AND :participant1 MEMBER OF c.participantIds AND :participant2 MEMBER OF c.participantIds")
    Conversation findDirectConversation(UUID participant1, UUID participant2);
    
    List<Conversation> findByConversationType(String conversationType);
}
