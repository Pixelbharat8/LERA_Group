package com.lera.connect_service.repository;

import com.lera.connect_service.entity.ChatPollOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatPollOptionRepository extends JpaRepository<ChatPollOption, UUID> {
    
    List<ChatPollOption> findByPollIdOrderByOptionIndexAsc(UUID pollId);
    
    void deleteByPollId(UUID pollId);
    
    @Modifying
    @Query("UPDATE ChatPollOption o SET o.voteCount = o.voteCount + 1 WHERE o.id = :optionId")
    void incrementVoteCount(@Param("optionId") UUID optionId);
    
    @Modifying
    @Query("UPDATE ChatPollOption o SET o.voteCount = o.voteCount - 1 WHERE o.id = :optionId AND o.voteCount > 0")
    void decrementVoteCount(@Param("optionId") UUID optionId);
}
