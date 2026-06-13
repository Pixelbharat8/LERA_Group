package com.lera.identity_service.repository;

import com.lera.identity_service.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    Page<AuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);

    @Query("""
        SELECT a FROM AuditLog a
         WHERE (:userId     IS NULL OR a.userId     = :userId)
           AND (:action     IS NULL OR a.action     = :action)
           AND (:entityType IS NULL OR a.entityType = :entityType)
           AND a.createdAt >= COALESCE(:since, a.createdAt)
         ORDER BY a.createdAt DESC
        """)
    Page<AuditLog> search(
            UUID userId,
            String action,
            String entityType,
            LocalDateTime since,
            Pageable pageable);
}
