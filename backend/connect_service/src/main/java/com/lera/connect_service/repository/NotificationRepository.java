package com.lera.connect_service.repository;

import com.lera.connect_service.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Notification> findByUserIdAndIsReadOrderByCreatedAtDesc(UUID userId, Boolean isRead);
    long countByUserIdAndIsRead(UUID userId, Boolean isRead);
    
    // Broadcast notifications (user_id is NULL - for all users)
    List<Notification> findByUserIdIsNullOrderByCreatedAtDesc();
    List<Notification> findByUserIdIsNullAndIsReadOrderByCreatedAtDesc(Boolean isRead);
    long countByUserIdIsNullAndIsRead(Boolean isRead);
    
    // Center-specific notifications
    List<Notification> findByCenterIdOrderByCreatedAtDesc(UUID centerId);
}
