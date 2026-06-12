package com.lera.connect_service.repository;

import com.lera.connect_service.entity.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockedUserRepository extends JpaRepository<BlockedUser, UUID> {

    // Find all users blocked by a specific user
    List<BlockedUser> findByBlockerId(UUID blockerId);

    // Find all users who blocked a specific user
    List<BlockedUser> findByBlockedId(UUID blockedId);

    // Check if user A has blocked user B
    Optional<BlockedUser> findByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    // Check if a block exists in either direction
    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM BlockedUser b " +
           "WHERE (b.blockerId = :user1 AND b.blockedId = :user2) " +
           "OR (b.blockerId = :user2 AND b.blockedId = :user1)")
    boolean existsBlockBetweenUsers(@Param("user1") UUID user1, @Param("user2") UUID user2);

    // Delete a specific block
    void deleteByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    // Get list of blocked user IDs for a user
    @Query("SELECT b.blockedId FROM BlockedUser b WHERE b.blockerId = :userId")
    List<UUID> findBlockedUserIds(@Param("userId") UUID userId);
}
