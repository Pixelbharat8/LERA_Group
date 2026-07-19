package com.lera.attendance_service.service;

import com.lera.attendance_service.repository.LeaveBalanceAccrualRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaveBalanceAccrualServiceTest {

    @Mock
    private LeaveBalanceAccrualRepository accrualRepository;
    @Mock
    private JdbcTemplate jdbcTemplate;
    @InjectMocks
    private LeaveBalanceAccrualService service;

    @Test
    void hasSufficientBalance_usesCurrentRunningBalanceNotYearSum() {
        UUID user = UUID.randomUUID();
        // The current available balance is the latest month's running total (3).
        // A year-SUM of each month's totalAvailable would compound the
        // carry-forward — e.g. Jan(1)+Feb(2)+Mar(3) = 6 — and wrongly let someone
        // take more leave than they have earned.
        when(accrualRepository.getCurrentAvailableLeavesByUserAndYear(eq(user), anyInt()))
                .thenReturn(3.0);

        assertTrue(service.hasSufficientBalance(user, 3.0));   // exactly enough
        assertFalse(service.hasSufficientBalance(user, 4.0));  // insufficient; a summed 6 would wrongly allow it
    }
}
