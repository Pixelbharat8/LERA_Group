package com.lera.attendance_service.repository;

import com.lera.attendance_service.entity.TeacherSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TeacherSessionRepository extends JpaRepository<TeacherSession, UUID> {
    
    List<TeacherSession> findByTeacherId(UUID teacherId);

    List<TeacherSession> findByClassIdOrderBySessionDateDesc(UUID classId);

    java.util.Optional<TeacherSession> findByClassSessionId(UUID classSessionId);
    
    List<TeacherSession> findByTeacherIdAndSessionDateBetween(
        UUID teacherId, 
        LocalDate startDate, 
        LocalDate endDate
    );
    
    @Query("SELECT COALESCE(SUM(ts.durationHours), 0) FROM TeacherSession ts " +
           "WHERE ts.teacherId = :teacherId " +
           "AND ts.sessionDate BETWEEN :startDate AND :endDate " +
           "AND ts.status = 'COMPLETED'")
    BigDecimal getTotalHoursForPeriod(
        @Param("teacherId") UUID teacherId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
