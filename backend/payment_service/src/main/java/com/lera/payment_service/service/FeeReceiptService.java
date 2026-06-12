package com.lera.payment_service.service;

import com.lera.payment_service.entity.FeeReceipt;
import com.lera.payment_service.repository.FeeReceiptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FeeReceiptService {

    private final FeeReceiptRepository feeReceiptRepository;

    public Page<FeeReceipt> getAllReceipts(Pageable pageable) {
        return feeReceiptRepository.findAll(pageable);
    }

    public Optional<FeeReceipt> getReceiptById(UUID id) {
        return feeReceiptRepository.findById(id);
    }

    public List<FeeReceipt> getReceiptsByStudent(UUID studentId) {
        return feeReceiptRepository.findByStudentId(studentId);
    }

    public List<FeeReceipt> getReceiptsByPayment(UUID paymentId) {
        return feeReceiptRepository.findByPaymentId(paymentId);
    }

    public List<FeeReceipt> getReceiptsByInvoice(UUID invoiceId) {
        return feeReceiptRepository.findByInvoiceId(invoiceId);
    }

    @Transactional
    public FeeReceipt createReceipt(FeeReceipt receipt) {
        log.info("Creating fee receipt for student: {}", receipt.getStudentId());
        return feeReceiptRepository.save(receipt);
    }

    @Transactional
    public Optional<FeeReceipt> updateReceipt(UUID id, FeeReceipt details) {
        return feeReceiptRepository.findById(id).map(existing -> {
            details.setId(id);
            return feeReceiptRepository.save(details);
        });
    }

    @Transactional
    public boolean deleteReceipt(UUID id) {
        if (feeReceiptRepository.existsById(id)) {
            feeReceiptRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
