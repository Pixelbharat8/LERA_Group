package com.lera.academy_service.repository;

import com.lera.academy_service.entity.StudentRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface StudentRegistrationRepository extends JpaRepository<StudentRegistration, UUID> {
    
    List<StudentRegistration> findByStatus(String status);
    
    List<StudentRegistration> findByPaymentStatus(String paymentStatus);
    
    List<StudentRegistration> findByCourseId(UUID courseId);
    
    List<StudentRegistration> findByRegistrationDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<StudentRegistration> findAllByOrderByCreatedAtDesc();
    
    long countByStatus(String status);
    
    long countByPaymentStatus(String paymentStatus);
}
