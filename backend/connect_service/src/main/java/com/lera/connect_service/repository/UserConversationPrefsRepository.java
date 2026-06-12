package com.lera.connect_service.repository;

import com.lera.connect_service.entity.UserConversationPrefs;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserConversationPrefsRepository extends JpaRepository<UserConversationPrefs, UUID> {

    // Find preferences for a specific user and conversation
    Optional<UserConversationPrefs> findByUserIdAndConversationId(UUID userId, UUID conversationId);

    // Find all preferences for a user
    List<UserConversationPrefs> findByUserId(UUID userId);

    // Find all pinned conversations for a user, ordered by pin order
    @Query("SELECT p FROM UserConversationPrefs p WHERE p.userId = :userId AND p.isPinned = true ORDER BY p.pinOrder ASC")
    List<UserConversationPrefs> findPinnedConversations(@Param("userId") UUID userId);

    // Find all archived conversations for a user
    @Query("SELECT p FROM UserConversationPrefs p WHERE p.userId = :userId AND p.isArchived = true")
    List<UserConversationPrefs> findArchivedConversations(@Param("userId") UUID userId);

    // Find all muted conversations for a user
    @Query("SELECT p FROM UserConversationPrefs p WHERE p.userId = :userId AND p.isMuted = true")
    List<UserConversationPrefs> findMutedConversations(@Param("userId") UUID userId);

    // Get max pin order for a user
    @Query("SELECT COALESCE(MAX(p.pinOrder), 0) FROM UserConversationPrefs p WHERE p.userId = :userId")
    int findMaxPinOrder(@Param("userId") UUID userId);

    // Check if a conversation is muted for a user
    @Query("SELECT CASE WHEN p.isMuted = true THEN true ELSE false END FROM UserConversationPrefs p " +
           "WHERE p.userId = :userId AND p.conversationId = :conversationId")
    boolean isConversationMuted(@Param("userId") UUID userId, @Param("conversationId") UUID conversationId);
}
