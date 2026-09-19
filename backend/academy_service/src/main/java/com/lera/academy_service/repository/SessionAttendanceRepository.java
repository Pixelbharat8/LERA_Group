package com.lera.academy_service.repository;

import com.lera.academy_service.entity.SessionAttendance;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SessionAttendanceRepository extends JpaRepository<SessionAttendance, UUID> {

    List<SessionAttendance> findBySessionId(UUID sessionId);

    List<SessionAttendance> findByStudentId(UUID studentId);

    Optional<SessionAttendance> findBySessionIdAndStudentId(UUID sessionId, UUID studentId);

    List<SessionAttendance> findByStatus(String status);

    long countByStudentIdAndStatus(UUID studentId, String status);

    /**
     * Present-count per session, for a whole term in one query. The class profile used to call
     * findBySessionId once per session and count in memory — 120 queries for a term, each
     * materialising every attendance row for that session, to produce one number per session.
     * Returns [sessionId, presentCount]; sessions with nobody present are simply absent.
     */
    @Query("SELECT a.sessionId, COUNT(a) FROM SessionAttendance a "
         + "WHERE a.sessionId IN :sessionIds AND UPPER(a.status) = 'PRESENT' "
         + "GROUP BY a.sessionId")
    List<Object[]> countPresentBySessionIds(@Param("sessionIds") Collection<UUID> sessionIds);
}
