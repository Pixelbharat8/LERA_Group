package com.lera.attendance_service.repository;

import com.lera.attendance_service.entity.AttendanceException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceExceptionRepository extends JpaRepository<AttendanceException, UUID> {
    List<AttendanceException> findByStudentId(UUID studentId);
    List<AttendanceException> findByStatus(String status);
    List<AttendanceException> findByClassId(UUID classId);
    List<AttendanceException> findByCenterId(UUID centerId);
}
