package com.lera.payment_service.service;

import com.lera.payment_service.repository.LedgerEntryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LedgerEntryServiceTest {

    @Mock private LedgerEntryRepository ledgerEntryRepository;
    @InjectMocks private LedgerEntryService service;

    @Test
    void financialSummary_computesNetBalanceFromCreditsAndDebits() {
        when(ledgerEntryRepository.getTotalCreditsBetween(any(), any())).thenReturn(new BigDecimal("900"));
        when(ledgerEntryRepository.getTotalDebitsBetween(any(), any())).thenReturn(new BigDecimal("400"));
        when(ledgerEntryRepository.getTotalCredits()).thenReturn(new BigDecimal("1200"));
        when(ledgerEntryRepository.getTotalDebits()).thenReturn(new BigDecimal("500"));

        Map<String, Object> s = service.getFinancialSummary(LocalDate.now().minusDays(30), LocalDate.now());

        assertEquals(0, ((BigDecimal) s.get("totalCredits")).compareTo(new BigDecimal("900")));
        assertEquals(0, ((BigDecimal) s.get("totalDebits")).compareTo(new BigDecimal("400")));
        assertEquals(0, ((BigDecimal) s.get("netBalance")).compareTo(new BigDecimal("500")));
        assertEquals(0, ((BigDecimal) s.get("overallCredits")).compareTo(new BigDecimal("1200")));
    }

    @Test
    void financialSummary_handlesEmptyLedgerWithoutNpe() {
        // SUM over no rows returns null — the service must coalesce to ZERO, not NPE.
        when(ledgerEntryRepository.getTotalCreditsBetween(any(), any())).thenReturn(null);
        when(ledgerEntryRepository.getTotalDebitsBetween(any(), any())).thenReturn(null);
        when(ledgerEntryRepository.getTotalCredits()).thenReturn(null);
        when(ledgerEntryRepository.getTotalDebits()).thenReturn(null);

        Map<String, Object> s = service.getFinancialSummary(null, null);

        assertEquals(0, ((BigDecimal) s.get("totalCredits")).compareTo(BigDecimal.ZERO));
        assertEquals(0, ((BigDecimal) s.get("totalDebits")).compareTo(BigDecimal.ZERO));
        assertEquals(0, ((BigDecimal) s.get("netBalance")).compareTo(BigDecimal.ZERO));
        assertEquals(0, ((BigDecimal) s.get("overallCredits")).compareTo(BigDecimal.ZERO));
        assertEquals(0, ((BigDecimal) s.get("overallDebits")).compareTo(BigDecimal.ZERO));
    }

    @Test
    void noArgFinancialSummary_delegatesWithNullRange() {
        when(ledgerEntryRepository.getTotalCreditsBetween(null, null)).thenReturn(new BigDecimal("10"));
        when(ledgerEntryRepository.getTotalDebitsBetween(null, null)).thenReturn(new BigDecimal("4"));
        when(ledgerEntryRepository.getTotalCredits()).thenReturn(new BigDecimal("10"));
        when(ledgerEntryRepository.getTotalDebits()).thenReturn(new BigDecimal("4"));

        Map<String, Object> s = service.getFinancialSummary();
        assertEquals(0, ((BigDecimal) s.get("netBalance")).compareTo(new BigDecimal("6")));
    }
}
