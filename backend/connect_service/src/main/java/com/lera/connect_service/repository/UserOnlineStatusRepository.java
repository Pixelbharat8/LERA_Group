package com.lera.connect_service.repository;

import com.lera.connect_service.entity.UserOnlineStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserOnlineStatusRepository extends JpaRepository<UserOnlineStatus, UUID> {
    
    // Find by user ID
    Optional<UserOnlineStatus> findByUserId(UUID userId);
    
    // Find all online users
    List<UserOnlineStatus> findByIsOnlineTrue();
    
    // Find online users from a list of user IDs
    @Query("SELECT u FROM UserOnlineStatus u WHERE u.userId IN :userIds AND u.isOnline = true")
    List<UserOnlineStatus> findOnlineUsersFromList(@Param("userIds") List<UUID> userIds);
    
    // Check if user is online
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM UserOnlineStatus u WHERE u.userId = :userId AND u.isOnline = true")
    boolean isUserOnline(@Param("userId") UUID userId);
}
