package com.lera.academy_service.repository;

import com.lera.academy_service.entity.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PointTransactionRepository extends JpaRepository<PointTransaction, UUID> {
    
    List<PointTransaction> findByStudentIdOrderByCreatedAtDesc(UUID studentId);
    
    List<PointTransaction> findByTransactionTypeOrderByCreatedAtDesc(String transactionType);
    
    List<PointTransaction> findByReasonOrderByCreatedAtDesc(String reason);
}
