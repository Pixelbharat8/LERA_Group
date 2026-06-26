package com.lera.payment_service.repository;

import com.lera.payment_service.entity.EnrolmentOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrolmentOrderRepository extends JpaRepository<EnrolmentOrder, UUID> {
    Optional<EnrolmentOrder> findByTxnRef(String txnRef);
}
