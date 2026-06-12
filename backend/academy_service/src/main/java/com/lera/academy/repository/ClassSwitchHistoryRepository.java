package com.lera.academy.repository;

import com.lera.academy.entity.ClassSwitchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ClassSwitchHistoryRepository extends JpaRepository<ClassSwitchHistory, UUID> {
    
    List<ClassSwitchHistory> findByStudentIdOrderBySwitchedAtDesc(UUID studentId);
    
    List<ClassSwitchHistory> findByOldClassIdOrderBySwitchedAtDesc(UUID oldClassId);
    
    List<ClassSwitchHistory> findByNewClassIdOrderBySwitchedAtDesc(UUID newClassId);
    
    @Query("SELECT csh FROM ClassSwitchHistory csh WHERE csh.studentId = :studentId AND csh.switchedAt BETWEEN :startDate AND :endDate ORDER BY csh.switchedAt DESC")
    List<ClassSwitchHistory> findByStudentIdAndDateRange(
        @Param("studentId") UUID studentId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT COUNT(csh) FROM ClassSwitchHistory csh WHERE csh.studentId = :studentId")
    long countByStudentId(@Param("studentId") UUID studentId);
}
