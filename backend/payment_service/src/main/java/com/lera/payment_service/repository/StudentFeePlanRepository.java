package com.lera.payment_service.repository;

import com.lera.payment_service.entity.StudentFeePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface StudentFeePlanRepository extends JpaRepository<StudentFeePlan, UUID> {
    List<StudentFeePlan> findByStudentId(UUID studentId);
    List<StudentFeePlan> findByStudentIdAndStatus(UUID studentId, String status);
    List<StudentFeePlan> findByStatus(String status);

    /** DB-side count (was findByStatus(..).size(), which loaded every plan row). */
    long countByStatus(String status);

    /**
     * Active plans for one centre. Fee plans carry only a studentId (students live in the academy
     * service), so a plan is attributed to the centre that bills the student — i.e. the centre on
     * that student's invoices. Students with no invoice yet are not counted.
     */
    @Query("SELECT COUNT(p) FROM StudentFeePlan p WHERE UPPER(p.status) = 'ACTIVE' "
            + "AND p.studentId IN (SELECT DISTINCT i.studentId FROM Invoice i WHERE i.centerId = :centerId)")
    long countActiveByCenter(@Param("centerId") UUID centerId);
}
