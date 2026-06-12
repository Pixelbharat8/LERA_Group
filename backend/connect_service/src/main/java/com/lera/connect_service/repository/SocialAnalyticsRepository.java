package com.lera.connect_service.repository;

import com.lera.connect_service.entity.SocialAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SocialAnalyticsRepository extends JpaRepository<SocialAnalytics, UUID> {
    
    List<SocialAnalytics> findByPlatform(String platform);
    
    Optional<SocialAnalytics> findByPlatformAndMetricDate(String platform, LocalDate metricDate);
    
    @Query("SELECT s FROM SocialAnalytics s WHERE s.metricDate BETWEEN :startDate AND :endDate ORDER BY s.metricDate DESC")
    List<SocialAnalytics> findByDateRange(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT s FROM SocialAnalytics s WHERE s.platform = :platform AND s.metricDate BETWEEN :startDate AND :endDate ORDER BY s.metricDate DESC")
    List<SocialAnalytics> findByPlatformAndDateRange(String platform, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT s FROM SocialAnalytics s WHERE s.metricDate = (SELECT MAX(s2.metricDate) FROM SocialAnalytics s2 WHERE s2.platform = s.platform)")
    List<SocialAnalytics> findLatestByPlatform();
    
    @Query("SELECT s FROM SocialAnalytics s WHERE s.platform = :platform ORDER BY s.metricDate DESC")
    List<SocialAnalytics> findByPlatformOrderByMetricDateDesc(String platform);
}
