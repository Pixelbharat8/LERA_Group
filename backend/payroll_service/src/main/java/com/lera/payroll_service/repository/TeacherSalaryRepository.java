package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.TeacherSalary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeacherSalaryRepository extends JpaRepository<TeacherSalary, UUID> {
    Optional<TeacherSalary> findByTeacherId(UUID teacherId);
}
