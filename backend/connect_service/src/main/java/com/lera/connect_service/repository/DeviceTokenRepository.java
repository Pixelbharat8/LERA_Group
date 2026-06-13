package com.lera.connect_service.repository;

import com.lera.connect_service.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, UUID> {
    List<DeviceToken> findByUserId(UUID userId);
    Optional<DeviceToken> findByToken(String token);

    /**
     * Self-managed transaction. Push delivery happens after the originating
     * notification has committed and the NotificationService transaction is
     * usually closed by then; without an explicit transaction here Spring
     * Data refuses the delete with TransactionRequiredException.
     */
    @Modifying
    @Transactional
    void deleteByToken(String token);
}
