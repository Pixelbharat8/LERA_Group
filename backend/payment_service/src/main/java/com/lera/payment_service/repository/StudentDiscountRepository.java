package com.lera.payment_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lera.payment_service.entity.StudentDiscount;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentDiscountRepository extends JpaRepository<StudentDiscount, UUID> {
    
    List<StudentDiscount> findByStudentId(UUID studentId);
    
    List<StudentDiscount> findByDiscountId(UUID discountId);
    
    List<StudentDiscount> findByStatus(String status);
    
    Optional<StudentDiscount> findByStudentIdAndDiscountId(UUID studentId, UUID discountId);
}
