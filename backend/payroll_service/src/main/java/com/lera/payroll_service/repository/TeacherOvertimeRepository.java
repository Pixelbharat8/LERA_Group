package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.TeacherOvertime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TeacherOvertimeRepository extends JpaRepository<TeacherOvertime, UUID> {
    List<TeacherOvertime> findByTeacherId(UUID teacherId);
    List<TeacherOvertime> findByStatus(String status);
    List<TeacherOvertime> findByOvertimeDateBetween(LocalDate start, LocalDate end);
}
