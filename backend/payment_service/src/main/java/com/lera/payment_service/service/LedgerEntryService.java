package com.lera.payment_service.service;

import com.lera.payment_service.entity.LedgerEntry;
import com.lera.payment_service.repository.LedgerEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LedgerEntryService {

    private final LedgerEntryRepository ledgerEntryRepository;

    public Page<LedgerEntry> getAllEntries(Pageable pageable) {
        return ledgerEntryRepository.findAll(pageable);
    }

    public Optional<LedgerEntry> getEntryById(UUID id) {
        return ledgerEntryRepository.findById(id);
    }

    public List<LedgerEntry> getEntriesByDateRange(LocalDate start, LocalDate end) {
        return ledgerEntryRepository.findByTransactionDateBetween(start, end);
    }

    public List<LedgerEntry> getEntriesByType(String entryType) {
        return ledgerEntryRepository.findByEntryType(entryType);
    }

    public List<LedgerEntry> getEntriesByStatus(String status) {
        return ledgerEntryRepository.findByStatus(status);
    }

    public List<LedgerEntry> getEntriesByCenter(UUID centerId) {
        return ledgerEntryRepository.findByCenterId(centerId);
    }

    public Map<String, Object> getFinancialSummary(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCredits", ledgerEntryRepository.getTotalCreditsBetween(startDate, endDate));
        summary.put("totalDebits", ledgerEntryRepository.getTotalDebitsBetween(startDate, endDate));
        summary.put("overallCredits", ledgerEntryRepository.getTotalCredits());
        summary.put("overallDebits", ledgerEntryRepository.getTotalDebits());
        BigDecimal credits = ledgerEntryRepository.getTotalCreditsBetween(startDate, endDate);
        BigDecimal debits = ledgerEntryRepository.getTotalDebitsBetween(startDate, endDate);
        summary.put("netBalance", credits.subtract(debits));
        return summary;
    }

    @Transactional
    public LedgerEntry createEntry(LedgerEntry entry) {
        log.info("Creating ledger entry: {} - {}", entry.getEntryType(), entry.getDescription());
        return ledgerEntryRepository.save(entry);
    }

    @Transactional
    public Optional<LedgerEntry> updateEntry(UUID id, LedgerEntry details) {
        return ledgerEntryRepository.findById(id).map(existing -> {
            details.setId(id);
            return ledgerEntryRepository.save(details);
        });
    }

    @Transactional
    public boolean deleteEntry(UUID id) {
        return ledgerEntryRepository.findById(id).map(entry -> {
            if (!"PENDING".equals(entry.getStatus())) return false;
            ledgerEntryRepository.deleteById(id);
            return true;
        }).orElse(false);
    }

    public Map<String, Object> getFinancialSummary() {
        return getFinancialSummary(null, null);
    }

    @Transactional
    public Optional<LedgerEntry> approveEntry(UUID id, java.util.UUID approvedBy) {
        return ledgerEntryRepository.findById(id).map(entry -> {
            if (approvedBy != null) entry.setApprovedBy(approvedBy);
            entry.setApprovedAt(java.time.LocalDateTime.now());
            entry.setStatus("APPROVED");
            return ledgerEntryRepository.save(entry);
        });
    }

    @Transactional
    public Optional<LedgerEntry> postEntry(UUID id) {
        return ledgerEntryRepository.findById(id).flatMap(entry -> {
            if (!"APPROVED".equals(entry.getStatus())) return Optional.empty();
            entry.setStatus("POSTED");
            return Optional.of(ledgerEntryRepository.save(entry));
        });
    }
}
