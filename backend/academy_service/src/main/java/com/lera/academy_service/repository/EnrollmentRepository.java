package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    
    List<Enrollment> findByStudentId(UUID studentId);
    
    List<Enrollment> findByClassId(UUID classId);
    
    List<Enrollment> findByStatus(String status);
    
    List<Enrollment> findByStudentIdAndStatus(UUID studentId, String status);
    
    boolean existsByStudentIdAndClassId(UUID studentId, UUID classId);
    
    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.classId = :classId AND e.status = 'ACTIVE'")
    long countActiveEnrollmentsByClassId(UUID classId);

    @Query("SELECT e FROM Enrollment e WHERE e.classId IN "
            + "(SELECT c.id FROM ClassEntity c WHERE c.centerId = :centerId)")
    List<Enrollment> findByCenterId(UUID centerId);

    /** Enrolments in a given status whose end date falls within [from, to] — drives renewal detection. */
    List<Enrollment> findByStatusAndEndDateBetween(String status, LocalDate from, LocalDate to);
}
