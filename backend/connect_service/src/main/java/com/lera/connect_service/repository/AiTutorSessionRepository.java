package com.lera.connect_service.repository;

import com.lera.connect_service.entity.AiTutorSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AiTutorSessionRepository extends JpaRepository<AiTutorSession, UUID> {
    
    List<AiTutorSession> findByStudentId(UUID studentId);
    
    List<AiTutorSession> findByConversationId(UUID conversationId);
    
    @Query("SELECT s FROM AiTutorSession s WHERE s.studentId = :studentId ORDER BY s.createdAt DESC")
    List<AiTutorSession> findRecentByStudent(@Param("studentId") UUID studentId);
    
    @Query("SELECT s FROM AiTutorSession s WHERE s.studentId = :studentId AND s.subject = :subject")
    List<AiTutorSession> findByStudentAndSubject(@Param("studentId") UUID studentId, @Param("subject") String subject);
    
    @Query("SELECT s FROM AiTutorSession s WHERE s.academyId = :academyId AND s.createdAt BETWEEN :start AND :end")
    List<AiTutorSession> findByAcademyAndDateRange(@Param("academyId") UUID academyId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT SUM(s.tokensUsed) FROM AiTutorSession s WHERE s.studentId = :studentId")
    Long getTotalTokensUsedByStudent(@Param("studentId") UUID studentId);
    
    @Query("SELECT AVG(s.feedbackRating) FROM AiTutorSession s WHERE s.academyId = :academyId AND s.feedbackRating IS NOT NULL")
    Double getAverageRatingByAcademy(@Param("academyId") UUID academyId);
    
    @Query("SELECT s.subject, COUNT(s) FROM AiTutorSession s WHERE s.studentId = :studentId GROUP BY s.subject")
    List<Object[]> getSubjectUsageByStudent(@Param("studentId") UUID studentId);
    
    List<AiTutorSession> findBySessionType(String sessionType);
    
    @Query("SELECT s FROM AiTutorSession s WHERE s.parentVisible = true AND s.studentId = :studentId ORDER BY s.createdAt DESC")
    List<AiTutorSession> findVisibleToParent(@Param("studentId") UUID studentId);
}
