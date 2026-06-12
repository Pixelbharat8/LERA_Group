package com.lera.connect_service.repository;

import com.lera.connect_service.entity.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, UUID> {
    List<CallLog> findByLeadId(UUID leadId);
    List<CallLog> findByCallerId(UUID callerId);
    List<CallLog> findByCallType(String callType);
    List<CallLog> findByCallStatus(String callStatus);
    List<CallLog> findByLeadIdOrderByCalledAtDesc(UUID leadId);
    List<CallLog> findByCalledAtBetween(LocalDateTime start, LocalDateTime end);
}
