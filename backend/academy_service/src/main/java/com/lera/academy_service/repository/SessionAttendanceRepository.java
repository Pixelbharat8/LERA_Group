package com.lera.academy_service.repository;

import com.lera.academy_service.entity.SessionAttendance;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SessionAttendanceRepository extends JpaRepository<SessionAttendance, UUID> {

    List<SessionAttendance> findBySessionId(UUID sessionId);

    List<SessionAttendance> findByStudentId(UUID studentId);

    Optional<SessionAttendance> findBySessionIdAndStudentId(UUID sessionId, UUID studentId);

    List<SessionAttendance> findByStatus(String status);

    long countByStudentIdAndStatus(UUID studentId, String status);
}
