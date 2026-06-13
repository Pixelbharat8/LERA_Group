package com.lera.academy_service.repository;

import com.lera.academy_service.entity.StudentPoints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentPointsRepository extends JpaRepository<StudentPoints, UUID> {
    
    Optional<StudentPoints> findByStudentId(UUID studentId);
    
    List<StudentPoints> findByCenterIdOrderByTotalPointsDesc(UUID centerId);
    
    @Query("SELECT sp FROM StudentPoints sp ORDER BY sp.totalPoints DESC")
    List<StudentPoints> findTopStudents();
    
    @Query("SELECT sp FROM StudentPoints sp WHERE sp.centerId = :centerId ORDER BY sp.totalPoints DESC LIMIT 10")
    List<StudentPoints> findTopStudentsByCenter(UUID centerId);
}
