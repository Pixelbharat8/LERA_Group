package com.lera.connect_service.repository;

import com.lera.connect_service.entity.ChatPollVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatPollVoteRepository extends JpaRepository<ChatPollVote, UUID> {
    
    List<ChatPollVote> findByPollId(UUID pollId);
    
    List<ChatPollVote> findByPollIdAndUserId(UUID pollId, UUID userId);
    
    Optional<ChatPollVote> findByPollIdAndUserIdAndOptionId(UUID pollId, UUID userId, UUID optionId);
    
    void deleteByPollIdAndUserId(UUID pollId, UUID userId);
    
    boolean existsByPollIdAndUserId(UUID pollId, UUID userId);
    
    long countByPollId(UUID pollId);
    
    long countByOptionId(UUID optionId);
}
