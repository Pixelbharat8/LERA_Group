package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.TeacherSalaryConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeacherSalaryConfigRepository extends JpaRepository<TeacherSalaryConfig, UUID> {
    
    Optional<TeacherSalaryConfig> findByTeacherId(UUID teacherId);
    
    Optional<TeacherSalaryConfig> findByTeacherIdAndStatus(UUID teacherId, String status);
}
