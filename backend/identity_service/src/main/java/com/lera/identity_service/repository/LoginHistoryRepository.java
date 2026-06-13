package com.lera.identity_service.repository;

import com.lera.identity_service.entity.LoginHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, UUID> {
    
    List<LoginHistory> findByUserId(UUID userId);
    
    Page<LoginHistory> findByUserId(UUID userId, Pageable pageable);
    
    List<LoginHistory> findByUserIdAndLoginAtBetween(UUID userId, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT lh FROM LoginHistory lh WHERE lh.userId = :userId AND lh.logoutAt IS NULL")
    List<LoginHistory> findActiveSessionsByUserId(UUID userId);
    
    long countByUserIdAndStatus(UUID userId, String status);
}
