package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {
    
    Optional<Student> findByStudentCode(String studentCode);
    
    Optional<Student> findByUserId(UUID userId);
    
    List<Student> findByCenterId(UUID centerId);
    
    List<Student> findByParentId(UUID parentId);
    
    List<Student> findByStatus(String status);
    
    List<Student> findByCenterIdAndStatus(UUID centerId, String status);
    
    @Query("SELECT s FROM Student s WHERE LOWER(s.fullname) LIKE LOWER(CONCAT('%', :search, '%')) OR s.studentCode LIKE CONCAT('%', :search, '%')")
    List<Student> searchStudents(String search);

    @Query("SELECT s FROM Student s WHERE (LOWER(s.fullname) LIKE LOWER(CONCAT('%', :search, '%')) OR s.studentCode LIKE CONCAT('%', :search, '%')) AND s.centerId = :centerId")
    List<Student> searchStudentsInCenter(String search, UUID centerId);
    
    long countByCenterId(UUID centerId);
    
    long countByCenterIdAndStatus(UUID centerId, String status);
}
