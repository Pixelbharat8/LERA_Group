package com.lera.attendance_service.service;

import com.lera.attendance_service.entity.LeaveBalanceAccrual;
import com.lera.attendance_service.repository.LeaveBalanceAccrualRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveBalanceAccrualService {

    private final LeaveBalanceAccrualRepository accrualRepository;
    private final JdbcTemplate jdbcTemplate;
    private static final Double MONTHLY_LEAVE_ACCRUAL = 1.0;

    /**
     * Process monthly leave accrual for a user
     * Called automatically on 1st of every month or manually
     */
    @Transactional
    public LeaveBalanceAccrual processMonthlyAccrual(UUID userId, UUID centerId, Integer year, Integer month) {
        log.info("Processing monthly accrual for user {} for {}/{}", userId, month, year);

        // Check if already processed
        var existingAccrual = accrualRepository.findByUserIdAndYearAndMonth(userId, year, month);
        if (existingAccrual.isPresent()) {
            log.info("Accrual already exists for user {} for {}/{}", userId, month, year);
            return existingAccrual.get();
        }

        // Get previous month's data for carry forward
        Double carriedForward = 0.0;
        if (month > 1) {
            var prevMonthAccrual = accrualRepository.findByUserIdAndYearAndMonth(userId, year, month - 1);
            if (prevMonthAccrual.isPresent()) {
                carriedForward = prevMonthAccrual.get().getTotalAvailable();
            }
        } else {
            // January - get December of previous year
            var prevYearDecAccrual = accrualRepository.findByUserIdAndYearAndMonth(userId, year - 1, 12);
            if (prevYearDecAccrual.isPresent()) {
                carriedForward = prevYearDecAccrual.get().getTotalAvailable();
            }
        }

        // Create new accrual entry
        LeaveBalanceAccrual accrual = LeaveBalanceAccrual.builder()
                .userId(userId)
                .centerId(centerId)
                .year(year)
                .month(month)
                .leavesAccrued(MONTHLY_LEAVE_ACCRUAL)
                .leavesUsed(0.0)
                .leavesCarriedForward(carriedForward)
                .totalAvailable(MONTHLY_LEAVE_ACCRUAL + carriedForward)
                .accrualDate(LocalDate.of(year, month, 1))
                .isProcessed(true)
                .notes("Monthly accrual processed")
                .build();

        accrual.calculateTotalAvailable();
        LeaveBalanceAccrual saved = accrualRepository.save(accrual);
        
        log.info("Created accrual: {} leave added, {} carried forward, {} total available", 
                 MONTHLY_LEAVE_ACCRUAL, carriedForward, saved.getTotalAvailable());
        
        return saved;
    }

    /**
     * Get current leave balance for a user
     */
    public Map<String, Object> getLeaveBalance(UUID userId) {
        LocalDate now = LocalDate.now();
        Integer currentYear = now.getYear();
        Integer currentMonth = now.getMonthValue();

        // Get current month's accrual (or create if doesn't exist)
        var currentAccrual = accrualRepository.findByUserIdAndYearAndMonth(userId, currentYear, currentMonth);
        
        if (currentAccrual.isEmpty()) {
            log.warn("No accrual found for user {} for current month. May need to run monthly processing.", userId);
        }

        // Get totals for the year
        Double totalAccrued = accrualRepository.getTotalAccruedLeavesByUserAndYear(userId, currentYear);
        Double totalUsed = accrualRepository.getTotalUsedLeavesByUserAndYear(userId, currentYear);
        Double totalAvailable = accrualRepository.getTotalAvailableLeavesByUserAndYear(userId, currentYear);

        Map<String, Object> balance = new HashMap<>();
        balance.put("userId", userId);
        balance.put("year", currentYear);
        balance.put("month", currentMonth);
        balance.put("totalAccruedThisYear", totalAccrued != null ? totalAccrued : 0.0);
        balance.put("totalUsedThisYear", totalUsed != null ? totalUsed : 0.0);
        balance.put("totalAvailable", totalAvailable != null ? totalAvailable : 0.0);
        balance.put("monthlyAccrualRate", MONTHLY_LEAVE_ACCRUAL);
        balance.put("expectedAnnualLeaves", MONTHLY_LEAVE_ACCRUAL * 12); // 12 leaves per year
        balance.put("isPermanent", true); // Default to true - permanent employees get leave benefits
        balance.put("maxAdvanceLeave", 3.0); // Maximum 3 days advance leave allowed per year
        
        if (currentAccrual.isPresent()) {
            LeaveBalanceAccrual accrual = currentAccrual.get();
            balance.put("currentMonthAccrued", accrual.getLeavesAccrued());
            balance.put("currentMonthUsed", accrual.getLeavesUsed());
            balance.put("currentMonthAvailable", accrual.getTotalAvailable());
            balance.put("carriedForward", accrual.getLeavesCarriedForward());
        }

        return balance;
    }

    /**
     * Deduct leave when approved
     */
    @Transactional
    public void deductLeave(UUID userId, UUID centerId, Integer year, Integer month, Double days) {
        log.info("Deducting {} days from user {} for {}/{}", days, userId, month, year);

        var accrualOpt = accrualRepository.findByUserIdAndYearAndMonth(userId, year, month);
        LeaveBalanceAccrual accrual;

        if (accrualOpt.isEmpty()) {
            // Create accrual if doesn't exist
            accrual = processMonthlyAccrual(userId, centerId, year, month);
        } else {
            accrual = accrualOpt.get();
        }

        // Deduct leaves
        accrual.setLeavesUsed(accrual.getLeavesUsed() + days);
        accrual.calculateTotalAvailable();
        accrualRepository.save(accrual);

        log.info("Deducted {} days. New balance: {} available", days, accrual.getTotalAvailable());
    }

    /**
     * Restore leave when cancelled
     */
    @Transactional
    public void restoreLeave(UUID userId, Integer year, Integer month, Double days) {
        log.info("Restoring {} days to user {} for {}/{}", days, userId, month, year);

        var accrualOpt = accrualRepository.findByUserIdAndYearAndMonth(userId, year, month);
        if (accrualOpt.isEmpty()) {
            log.warn("No accrual found to restore leave for user {} for {}/{}", userId, month, year);
            return;
        }

        LeaveBalanceAccrual accrual = accrualOpt.get();
        accrual.setLeavesUsed(Math.max(0, accrual.getLeavesUsed() - days));
        accrual.calculateTotalAvailable();
        accrualRepository.save(accrual);

        log.info("Restored {} days. New balance: {} available", days, accrual.getTotalAvailable());
    }

    /**
     * Check if user has sufficient leave balance
     */
    public boolean hasSufficientBalance(UUID userId, Double daysRequired) {
        LocalDate now = LocalDate.now();
        Double totalAvailable = accrualRepository.getTotalAvailableLeavesByUserAndYear(userId, now.getYear());
        return totalAvailable != null && totalAvailable >= daysRequired;
    }

    /**
     * Get leave history for a user
     */
    public List<LeaveBalanceAccrual> getLeaveHistory(UUID userId, Integer year) {
        if (year != null) {
            return accrualRepository.findByUserIdAndYear(userId, year);
        }
        return accrualRepository.findByUserIdOrderByYearDescMonthDesc(userId);
    }

    /**
     * Scheduled job to run on 1st of every month at midnight
     * Processes accruals for all active users
     */
    @Scheduled(cron = "0 0 0 1 * ?") // Run at midnight on 1st of every month
    public void scheduleMonthlyAccrualProcessing() {
        log.info("Starting scheduled monthly leave accrual processing");

        // Accrue for the month that just ended (job runs on the 1st).
        LocalDate previousMonth = LocalDate.now().minusMonths(1);
        int year = previousMonth.getYear();
        int month = previousMonth.getMonthValue();

        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT DISTINCT user_id, center_id FROM teachers "
                            + "WHERE UPPER(TRIM(COALESCE(status, ''))) = 'ACTIVE' AND user_id IS NOT NULL");
            log.info("Monthly accrual for {}/{} — {} active teacher/staff user rows", year, month, rows.size());
            for (Map<String, Object> row : rows) {
                Object uid = row.get("user_id");
                Object cid = row.get("center_id");
                if (uid == null) {
                    continue;
                }
                UUID userId = uid instanceof UUID u ? u : UUID.fromString(uid.toString());
                UUID centerId = null;
                if (cid != null) {
                    centerId = cid instanceof UUID u ? u : UUID.fromString(cid.toString());
                }
                processMonthlyAccrual(userId, centerId, year, month);
            }
        } catch (Exception e) {
            log.error("Scheduled leave accrual failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Manually trigger accrual for a specific user
     * Used when a new user joins mid-year
     */
    @Transactional
    public void initializeAccrualsForNewUser(UUID userId, UUID centerId, LocalDate joinDate) {
        log.info("Initializing accruals for new user {} from join date {}", userId, joinDate);

        LocalDate now = LocalDate.now();
        int startYear = joinDate.getYear();
        int startMonth = joinDate.getMonthValue();
        int endYear = now.getYear();
        int endMonth = now.getMonthValue();

        // Create accruals from join date to current month
        for (int year = startYear; year <= endYear; year++) {
            int monthStart = (year == startYear) ? startMonth : 1;
            int monthEnd = (year == endYear) ? endMonth : 12;

            for (int month = monthStart; month <= monthEnd; month++) {
                if (!accrualRepository.existsByUserIdAndYearAndMonth(userId, year, month)) {
                    processMonthlyAccrual(userId, centerId, year, month);
                }
            }
        }

        log.info("Completed initializing accruals for user {}", userId);
    }
}
