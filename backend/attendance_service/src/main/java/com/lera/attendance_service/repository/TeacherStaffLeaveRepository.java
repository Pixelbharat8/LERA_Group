package com.lera.attendance_service.repository;

import com.lera.attendance_service.entity.TeacherStaffLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TeacherStaffLeaveRepository extends JpaRepository<TeacherStaffLeave, UUID> {

    // Find by user
    List<TeacherStaffLeave> findByUserId(UUID userId);

    // Find by user and status
    List<TeacherStaffLeave> findByUserIdAndStatus(UUID userId, String status);

    // Find by center
    List<TeacherStaffLeave> findByCenterId(UUID centerId);

    // Find by center and status
    List<TeacherStaffLeave> findByCenterIdAndStatus(UUID centerId, String status);

    // Find pending leaves for a center
    @Query("SELECT l FROM TeacherStaffLeave l WHERE l.centerId = :centerId AND l.status = 'PENDING' ORDER BY l.requestedAt DESC")
    List<TeacherStaffLeave> findPendingLeavesByCenter(@Param("centerId") UUID centerId);

    // Find approved leaves for a date range
    @Query("SELECT l FROM TeacherStaffLeave l WHERE l.userId = :userId AND l.status = 'APPROVED' AND " +
           "((l.leaveDate <= :date AND (l.endDate IS NULL OR l.endDate >= :date)) OR l.leaveDate = :date)")
    List<TeacherStaffLeave> findApprovedLeavesForDate(@Param("userId") UUID userId, @Param("date") LocalDate date);

    // Find leaves in date range
    @Query("SELECT l FROM TeacherStaffLeave l WHERE l.centerId = :centerId AND " +
           "((l.leaveDate BETWEEN :startDate AND :endDate) OR (l.endDate BETWEEN :startDate AND :endDate) OR " +
           "(l.leaveDate <= :startDate AND l.endDate >= :endDate))")
    List<TeacherStaffLeave> findLeavesByDateRange(@Param("centerId") UUID centerId, 
                                                   @Param("startDate") LocalDate startDate, 
                                                   @Param("endDate") LocalDate endDate);

    // Find by user type
    List<TeacherStaffLeave> findByUserTypeAndCenterId(String userType, UUID centerId);

    // Count pending leaves by center
    @Query("SELECT COUNT(l) FROM TeacherStaffLeave l WHERE l.centerId = :centerId AND l.status = 'PENDING'")
    Long countPendingLeavesByCenter(@Param("centerId") UUID centerId);

    // Get leave balance for user (approved leaves in current year)
    @Query("SELECT COALESCE(SUM(l.daysCount), 0) FROM TeacherStaffLeave l WHERE l.userId = :userId AND " +
           "l.status = 'APPROVED' AND YEAR(l.leaveDate) = :year")
    Integer getTotalLeaveDaysByUserAndYear(@Param("userId") UUID userId, @Param("year") int year);

    // Find leaves by status list
    List<TeacherStaffLeave> findByCenterIdAndStatusIn(UUID centerId, List<String> statuses);

    // Find all leaves for a user in a year
    @Query("SELECT l FROM TeacherStaffLeave l WHERE l.userId = :userId AND " +
           "YEAR(l.leaveDate) = :year ORDER BY l.leaveDate DESC")
    List<TeacherStaffLeave> findLeavesByUserAndYear(@Param("userId") UUID userId, @Param("year") int year);

    // Find leaves by reporting manager (for approval)
    List<TeacherStaffLeave> findByReportingManagerId(UUID reportingManagerId);

    // Find pending leaves by reporting manager
    @Query("SELECT l FROM TeacherStaffLeave l WHERE l.reportingManagerId = :managerId AND l.status = 'PENDING' ORDER BY l.requestedAt DESC")
    List<TeacherStaffLeave> findPendingLeavesByReportingManager(@Param("managerId") UUID managerId);

    // Find leaves CC'd to center manager (view only)
    List<TeacherStaffLeave> findByCenterManagerId(UUID centerManagerId);

    // Find leaves CC'd to center manager with status filter
    @Query("SELECT l FROM TeacherStaffLeave l WHERE l.centerManagerId = :managerId ORDER BY l.requestedAt DESC")
    List<TeacherStaffLeave> findLeavesByCenterManager(@Param("managerId") UUID managerId);
}
