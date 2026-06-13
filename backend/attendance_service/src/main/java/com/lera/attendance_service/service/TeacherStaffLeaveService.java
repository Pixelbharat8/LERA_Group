package com.lera.attendance_service.service;

import com.lera.attendance_service.client.NotificationClient;
import com.lera.attendance_service.entity.TeacherStaffLeave;
import com.lera.attendance_service.repository.TeacherStaffLeaveRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherStaffLeaveService {

    private final TeacherStaffLeaveRepository leaveRepository;
    private final LeaveBalanceAccrualService accrualService;
    private final NotificationClient notificationClient;

    /**
     * Apply for leave - Now checks monthly accrual balance
     * Supports advance leave for permanent employees
     * Notifies: Reporting Manager (approver), Center Manager (CC), CEO, Chairman
     */
    @Transactional
    public TeacherStaffLeave applyLeave(TeacherStaffLeave leave) {
        leave.calculateDaysCount();
        
        // Check if employee is permanent - only permanent employees get leave accrual
        String employmentType = leave.getEmploymentType();
        boolean isPermanent = "PERMANENT".equalsIgnoreCase(employmentType) || 
                              "FULL_TIME".equalsIgnoreCase(employmentType);
        
        if (!isPermanent && employmentType != null) {
            throw new RuntimeException("Leave benefits are only available for permanent/full-time employees. Your employment type: " + employmentType);
        }
        
        // Check if user has sufficient leave balance
        Double daysRequired = leave.getHalfDay() ? 0.5 : leave.getDaysCount().doubleValue();
        boolean hasSufficientBalance = accrualService.hasSufficientBalance(leave.getUserId(), daysRequired);
        
        // If insufficient balance, check if advance leave is allowed
        if (!hasSufficientBalance) {
            // Allow advance leave up to 3 days per year for permanent employees
            if (isPermanent || employmentType == null) {
                Map<String, Object> balanceInfo = accrualService.getLeaveBalance(leave.getUserId());
                Double available = (Double) balanceInfo.getOrDefault("totalAvailable", 0.0);
                Double advanceNeeded = daysRequired - (available != null ? available : 0.0);
                
                // Maximum 3 days advance leave per year
                if (advanceNeeded <= 3.0) {
                    leave.setIsAdvanceLeave(true);
                    leave.setAdvanceLeaveCount(advanceNeeded);
                    log.info("Advance leave requested: {} days for user: {}", advanceNeeded, leave.getUserId());
                } else {
                    throw new RuntimeException("Insufficient leave balance. Available: " + 
                        (available != null ? available : 0.0) + " days. Maximum advance leave allowed: 3 days per year.");
                }
            } else {
                throw new RuntimeException("Insufficient leave balance. Please check your available leaves.");
            }
        }
        
        leave.setStatus("PENDING");
        leave.setRequestedAt(LocalDateTime.now());
        
        // Notifications
        leave.setNotifiedToCeo(true); // CEO visibility
        leave.setNotifiedToChairman(true); // Chairman visibility
        leave.setCenterManagerNotified(true); // Center Manager in CC (not approver)
        
        log.info("Leave application created for user: {} at center: {}, advance: {}", 
                leave.getUserId(), leave.getCenterId(), leave.getIsAdvanceLeave());
        log.info("Notified → Reporting Manager (approver), Center Manager (CC), CEO, Chairman");
        
        TeacherStaffLeave savedLeave = leaveRepository.save(leave);
        
        // Send notification to managers
        try {
            String employeeName = leave.getRequestedBy() != null ? leave.getRequestedBy().toString() : "Employee";
            // If user name is available in entity, use it
            notificationClient.notifyLeaveApplication(
                leave.getUserId(),
                employeeName,
                leave.getLeaveType(),
                leave.getLeaveDate().toString(),
                leave.getEndDate() != null ? leave.getEndDate().toString() : leave.getLeaveDate().toString(),
                savedLeave.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to send leave notification, but leave was saved successfully", e);
        }
        
        return savedLeave;
    }

    /**
     * Get leave by ID
     */
    public TeacherStaffLeave getLeaveById(UUID id) {
        return leaveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave not found with id: " + id));
    }

    /**
     * Get all leaves for a user
     */
    public List<TeacherStaffLeave> getLeavesByUser(UUID userId) {
        return leaveRepository.findByUserId(userId);
    }

    /**
     * Get leaves by center
     */
    public List<TeacherStaffLeave> getLeavesByCenter(UUID centerId) {
        return leaveRepository.findByCenterId(centerId);
    }

    /**
     * Get pending leaves for a center
     */
    public List<TeacherStaffLeave> getPendingLeavesByCenter(UUID centerId) {
        return leaveRepository.findPendingLeavesByCenter(centerId);
    }

    /**
     * Get leaves by center and status
     */
    public List<TeacherStaffLeave> getLeavesByCenterAndStatus(UUID centerId, String status) {
        return leaveRepository.findByCenterIdAndStatus(centerId, status);
    }

    /**
     * Get leaves in date range
     */
    public List<TeacherStaffLeave> getLeavesByDateRange(UUID centerId, LocalDate startDate, LocalDate endDate) {
        return leaveRepository.findLeavesByDateRange(centerId, startDate, endDate);
    }

    /**
     * Approve leave - Now deducts from monthly accrual
     */
    @Transactional
    public TeacherStaffLeave approveLeave(UUID leaveId, UUID approvedBy, String approverRole, Boolean isPaid, String comments) {
        TeacherStaffLeave leave = getLeaveById(leaveId);
        
        if (!"PENDING".equals(leave.getStatus())) {
            throw new RuntimeException("Leave is not in pending status");
        }
        
        // Deduct leave from monthly accrual
        Double daysToDeduct = leave.getHalfDay() ? 0.5 : leave.getDaysCount().doubleValue();
        Integer leaveMonth = leave.getLeaveDate().getMonthValue();
        Integer leaveYear = leave.getLeaveDate().getYear();
        
        accrualService.deductLeave(leave.getUserId(), leave.getCenterId(), leaveYear, leaveMonth, daysToDeduct);
        
        leave.setStatus("APPROVED");
        leave.setApprovedBy(approvedBy);
        leave.setApprovedAt(LocalDateTime.now());
        leave.setApproverRole(approverRole);
        leave.setIsPaid(isPaid);
        leave.setComments(comments);
        
        log.info("Leave approved - ID: {}, Approver: {}, Role: {}, Days deducted: {}", 
                leaveId, approvedBy, approverRole, daysToDeduct);
        
        TeacherStaffLeave savedLeave = leaveRepository.save(leave);
        
        // Send approval notification to employee
        try {
            notificationClient.notifyLeaveApproved(
                leave.getUserId(),
                leave.getLeaveType(),
                leave.getLeaveDate().toString(),
                leave.getEndDate() != null ? leave.getEndDate().toString() : leave.getLeaveDate().toString(),
                approverRole != null ? approverRole : "Manager"
            );
        } catch (Exception e) {
            log.warn("Failed to send leave approval notification", e);
        }
        
        return savedLeave;
    }

    /**
     * Reject leave
     */
    @Transactional
    public TeacherStaffLeave rejectLeave(UUID leaveId, UUID rejectedBy, String rejectionReason, String approverRole) {
        TeacherStaffLeave leave = getLeaveById(leaveId);
        
        if (!"PENDING".equals(leave.getStatus())) {
            throw new RuntimeException("Leave is not in pending status");
        }
        
        leave.setStatus("REJECTED");
        leave.setApprovedBy(rejectedBy);
        leave.setApprovedAt(LocalDateTime.now());
        leave.setApproverRole(approverRole);
        leave.setRejectionReason(rejectionReason);
        
        log.info("Leave rejected - ID: {}, Rejector: {}, Role: {}", leaveId, rejectedBy, approverRole);
        
        TeacherStaffLeave savedLeave = leaveRepository.save(leave);
        
        // Send rejection notification to employee
        try {
            notificationClient.notifyLeaveRejected(
                leave.getUserId(),
                leave.getLeaveType(),
                leave.getLeaveDate().toString(),
                leave.getEndDate() != null ? leave.getEndDate().toString() : leave.getLeaveDate().toString(),
                approverRole != null ? approverRole : "Manager",
                rejectionReason
            );
        } catch (Exception e) {
            log.warn("Failed to send leave rejection notification", e);
        }
        
        return savedLeave;
    }

    /**
     * Cancel leave - Now restores to monthly accrual
     */
    @Transactional
    public TeacherStaffLeave cancelLeave(UUID leaveId, UUID userId) {
        TeacherStaffLeave leave = getLeaveById(leaveId);
        
        // Only allow cancellation by the requester and if status is PENDING or APPROVED
        if (!leave.getRequestedBy().equals(userId)) {
            throw new RuntimeException("Only the requester can cancel the leave");
        }
        
        if (!Arrays.asList("PENDING", "APPROVED").contains(leave.getStatus())) {
            throw new RuntimeException("Leave cannot be cancelled in current status");
        }
        
        // If was APPROVED, restore the leave balance
        if ("APPROVED".equals(leave.getStatus())) {
            Double daysToRestore = leave.getHalfDay() ? 0.5 : leave.getDaysCount().doubleValue();
            Integer leaveMonth = leave.getLeaveDate().getMonthValue();
            Integer leaveYear = leave.getLeaveDate().getYear();
            
            accrualService.restoreLeave(leave.getUserId(), leaveYear, leaveMonth, daysToRestore);
            log.info("Restored {} days to user {} for {}/{}", daysToRestore, leave.getUserId(), leaveMonth, leaveYear);
        }
        
        leave.setStatus("CANCELLED");
        leave.setUpdatedAt(LocalDateTime.now());
        
        log.info("Leave cancelled - ID: {}, User: {}", leaveId, userId);
        
        return leaveRepository.save(leave);
    }

    /**
     * Check if user has approved leave for a date
     */
    public boolean hasApprovedLeaveForDate(UUID userId, LocalDate date) {
        List<TeacherStaffLeave> leaves = leaveRepository.findApprovedLeavesForDate(userId, date);
        return !leaves.isEmpty();
    }

    /**
     * Get leave balance for user - Now uses monthly accrual system
     */
    public Map<String, Object> getLeaveBalance(UUID userId) {
        return accrualService.getLeaveBalance(userId);
    }

    /**
     * Get leaves by user and year
     */
    public List<TeacherStaffLeave> getLeavesByUserAndYear(UUID userId, int year) {
        return leaveRepository.findLeavesByUserAndYear(userId, year);
    }

    /**
     * Count pending leaves by center
     */
    public Long countPendingLeavesByCenter(UUID centerId) {
        return leaveRepository.countPendingLeavesByCenter(centerId);
    }

    /**
     * Get leaves by user type
     */
    public List<TeacherStaffLeave> getLeavesByUserType(String userType, UUID centerId) {
        return leaveRepository.findByUserTypeAndCenterId(userType, centerId);
    }

    /**
     * Get all leaves (admin only)
     */
    public List<TeacherStaffLeave> getAllLeaves() {
        return leaveRepository.findAll();
    }

    /**
     * Get leaves by reporting manager (approver)
     */
    public List<TeacherStaffLeave> getLeavesByReportingManager(UUID managerId) {
        return leaveRepository.findByReportingManagerId(managerId);
    }

    /**
     * Get pending leaves by reporting manager
     */
    public List<TeacherStaffLeave> getPendingLeavesByReportingManager(UUID managerId) {
        return leaveRepository.findPendingLeavesByReportingManager(managerId);
    }

    /**
     * Get leaves CC'd to center manager (view only, not approver)
     */
    public List<TeacherStaffLeave> getLeavesByCenterManager(UUID managerId) {
        return leaveRepository.findLeavesByCenterManager(managerId);
    }
}
