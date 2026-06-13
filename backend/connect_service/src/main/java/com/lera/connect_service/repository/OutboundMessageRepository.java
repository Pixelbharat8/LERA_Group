package com.lera.connect_service.repository;

import com.lera.connect_service.entity.OutboundMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OutboundMessageRepository extends JpaRepository<OutboundMessage, UUID> {
    List<OutboundMessage> findByLeadIdOrderByCreatedAtDesc(UUID leadId);
    List<OutboundMessage> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
