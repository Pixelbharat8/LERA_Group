package com.lera.payment_service.repository;

import com.lera.payment_service.entity.StudentFeePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface StudentFeePlanRepository extends JpaRepository<StudentFeePlan, UUID> {
    List<StudentFeePlan> findByStudentId(UUID studentId);
    List<StudentFeePlan> findByStudentIdAndStatus(UUID studentId, String status);
    List<StudentFeePlan> findByStatus(String status);
}
