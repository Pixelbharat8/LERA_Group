package com.lera.attendance_service.repository;

import com.lera.attendance_service.entity.AttendanceRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, UUID> {
    
    List<AttendanceRecord> findByStudentIdOrderByCreatedAtDesc(UUID studentId);
    
    List<AttendanceRecord> findBySessionIdOrderByCreatedAtDesc(UUID sessionId);
    
    List<AttendanceRecord> findBySessionId(UUID sessionId);

    List<AttendanceRecord> findBySessionIdIn(List<UUID> sessionIds);
    
    List<AttendanceRecord> findByCenterIdOrderByCreatedAtDesc(UUID centerId);

    List<AttendanceRecord> findByMarkedByOrderByCreatedAtDesc(UUID markedBy);

    Page<AttendanceRecord> findByCenterId(UUID centerId, Pageable pageable);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE (:centerId IS NULL OR a.centerId = :centerId)")
    long countForOptionalCenter(@Param("centerId") UUID centerId);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE (:centerId IS NULL OR a.centerId = :centerId) "
            + "AND UPPER(a.status) IN ('PRESENT','CHECKED_IN','LATE')")
    long countPositiveStatusForOptionalCenter(@Param("centerId") UUID centerId);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE (:centerId IS NULL OR a.centerId = :centerId) "
            + "AND UPPER(a.status) = 'ABSENT'")
    long countAbsentForOptionalCenter(@Param("centerId") UUID centerId);
    
    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE a.studentId = :studentId AND a.status = 'PRESENT'")
    long countPresentByStudent(UUID studentId);
    
    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE a.studentId = :studentId AND a.status = 'ABSENT'")
    long countAbsentByStudent(UUID studentId);
    
    List<AttendanceRecord> findAllByOrderByCreatedAtDesc();
    
    boolean existsByStudentIdAndSessionId(UUID studentId, UUID sessionId);

    java.util.Optional<AttendanceRecord> findBySessionIdAndStudentId(UUID sessionId, UUID studentId);
}
