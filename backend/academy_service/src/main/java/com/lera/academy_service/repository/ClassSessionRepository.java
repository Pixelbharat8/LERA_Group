package com.lera.academy_service.repository;

import com.lera.academy_service.entity.ClassSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ClassSessionRepository extends JpaRepository<ClassSession, UUID> {
    List<ClassSession> findByClassId(UUID classId);
    List<ClassSession> findByTeacherId(UUID teacherId);
    List<ClassSession> findBySessionDate(LocalDate sessionDate);
    List<ClassSession> findByStatus(String status);
    List<ClassSession> findByClassIdAndSessionDate(UUID classId, LocalDate sessionDate);

    @Query("SELECT cs FROM ClassSession cs WHERE cs.classId = :classId AND cs.sessionDate BETWEEN :startDate AND :endDate")
    List<ClassSession> findByClassIdAndDateRange(UUID classId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT cs FROM ClassSession cs WHERE cs.sessionDate = :sessionDate AND cs.startTime <= :endTime AND cs.endTime >= :startTime")
    List<ClassSession> findSessionConflicts(LocalDate sessionDate, LocalTime startTime, LocalTime endTime);
}
