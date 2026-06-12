package com.lera.identity_service.service;

import com.lera.identity_service.entity.LoginHistory;
import com.lera.identity_service.repository.LoginHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoginHistoryService {

    private final LoginHistoryRepository loginHistoryRepository;

    @Transactional
    public LoginHistory recordLogin(UUID userId, String ipAddress, String userAgent, 
                                   String deviceType, String browser, String location) {
        log.info("Recording login for user: {}", userId);
        
        LoginHistory loginHistory = LoginHistory.builder()
            .userId(userId)
            .loginAt(LocalDateTime.now())
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .deviceType(deviceType)
            .browser(browser)
            .location(location)
            .status("SUCCESS")
            .build();
        
        return loginHistoryRepository.save(loginHistory);
    }

    @Transactional
    public LoginHistory recordFailedLogin(UUID userId, String ipAddress, String userAgent, String failureReason) {
        log.info("Recording failed login for user: {}", userId);
        
        LoginHistory loginHistory = LoginHistory.builder()
            .userId(userId)
            .loginAt(LocalDateTime.now())
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .status("FAILED")
            .failureReason(failureReason)
            .build();
        
        return loginHistoryRepository.save(loginHistory);
    }

    @Transactional
    public void recordLogout(UUID loginHistoryId) {
        log.info("Recording logout for login history: {}", loginHistoryId);
        
        loginHistoryRepository.findById(loginHistoryId).ifPresent(loginHistory -> {
            loginHistory.setLogoutAt(LocalDateTime.now());
            loginHistoryRepository.save(loginHistory);
        });
    }

    @Transactional(readOnly = true)
    public Page<LoginHistory> getUserLoginHistory(UUID userId, Pageable pageable) {
        return loginHistoryRepository.findByUserId(userId, pageable);
    }

    @Transactional(readOnly = true)
    public List<LoginHistory> getActiveSessions(UUID userId) {
        return loginHistoryRepository.findActiveSessionsByUserId(userId);
    }

    @Transactional(readOnly = true)
    public long countFailedLogins(UUID userId) {
        return loginHistoryRepository.countByUserIdAndStatus(userId, "FAILED");
    }
}
