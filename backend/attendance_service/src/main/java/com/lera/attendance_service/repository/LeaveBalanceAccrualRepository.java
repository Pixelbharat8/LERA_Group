package com.lera.attendance_service.repository;

import com.lera.attendance_service.entity.LeaveBalanceAccrual;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveBalanceAccrualRepository extends JpaRepository<LeaveBalanceAccrual, UUID> {

    // Find accrual for specific user, year, and month
    Optional<LeaveBalanceAccrual> findByUserIdAndYearAndMonth(UUID userId, Integer year, Integer month);

    // Find all accruals for a user in a specific year
    List<LeaveBalanceAccrual> findByUserIdAndYear(UUID userId, Integer year);

    // Find all accruals for a user (all years)
    List<LeaveBalanceAccrual> findByUserIdOrderByYearDescMonthDesc(UUID userId);

    List<LeaveBalanceAccrual> findByCenterIdOrderByYearDescMonthDesc(UUID centerId);

    // Find all users in a center for monthly processing
    @Query("SELECT DISTINCT lba.userId FROM LeaveBalanceAccrual lba WHERE lba.centerId = :centerId")
    List<UUID> findDistinctUserIdsByCenterId(UUID centerId);

    // Get total available leaves for a user across all months in current year
    @Query("SELECT COALESCE(SUM(lba.totalAvailable), 0.0) FROM LeaveBalanceAccrual lba " +
           "WHERE lba.userId = :userId AND lba.year = :year")
    Double getTotalAvailableLeavesByUserAndYear(UUID userId, Integer year);

    // Get total used leaves for a user in a specific year
    @Query("SELECT COALESCE(SUM(lba.leavesUsed), 0.0) FROM LeaveBalanceAccrual lba " +
           "WHERE lba.userId = :userId AND lba.year = :year")
    Double getTotalUsedLeavesByUserAndYear(UUID userId, Integer year);

    // Get total accrued leaves for a user in a specific year
    @Query("SELECT COALESCE(SUM(lba.leavesAccrued), 0.0) FROM LeaveBalanceAccrual lba " +
           "WHERE lba.userId = :userId AND lba.year = :year")
    Double getTotalAccruedLeavesByUserAndYear(UUID userId, Integer year);

    // Find unprocessed accruals (for batch processing)
    List<LeaveBalanceAccrual> findByIsProcessedFalse();

    // Check if accrual exists for user in specific month
    boolean existsByUserIdAndYearAndMonth(UUID userId, Integer year, Integer month);
}
