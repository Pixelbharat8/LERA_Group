package com.lera.social_media_service.repository;

import com.lera.social_media_service.entity.SocialAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SocialAnalyticsRepository extends JpaRepository<SocialAnalytics, UUID> {
    
    List<SocialAnalytics> findByPlatformOrderByMetricDateDesc(String platform);
    
    List<SocialAnalytics> findByMetricDate(LocalDate metricDate);
    
    @Query("SELECT a FROM SocialAnalytics a WHERE a.metricDate BETWEEN :startDate AND :endDate ORDER BY a.platform, a.metricDate")
    List<SocialAnalytics> findByDateRange(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT a FROM SocialAnalytics a WHERE a.metricDate = (SELECT MAX(a2.metricDate) FROM SocialAnalytics a2 WHERE a2.platform = a.platform)")
    List<SocialAnalytics> findLatestByPlatform();
    
    @Query("SELECT a FROM SocialAnalytics a WHERE a.platform = :platform AND a.metricDate BETWEEN :startDate AND :endDate ORDER BY a.metricDate")
    List<SocialAnalytics> findByPlatformAndDateRange(String platform, LocalDate startDate, LocalDate endDate);
}
