package com.lera.payment_service.repository;

import com.lera.payment_service.entity.FeeReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FeeReceiptRepository extends JpaRepository<FeeReceipt, UUID> {
    List<FeeReceipt> findByStudentId(UUID studentId);
    List<FeeReceipt> findByPaymentId(UUID paymentId);
    List<FeeReceipt> findByInvoiceId(UUID invoiceId);
}
