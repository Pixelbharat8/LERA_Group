package com.lera.connect_service.repository;

import com.lera.connect_service.entity.ParentTeacherMeeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ParentTeacherMeetingRepository extends JpaRepository<ParentTeacherMeeting, UUID> {
    
    List<ParentTeacherMeeting> findByTeacherId(UUID teacherId);
    
    List<ParentTeacherMeeting> findByParentId(UUID parentId);
    
    List<ParentTeacherMeeting> findByStudentId(UUID studentId);
    
    @Query("SELECT m FROM ParentTeacherMeeting m WHERE m.teacherId = :teacherId AND m.scheduledAt > :now AND m.status != 'CANCELLED' ORDER BY m.scheduledAt ASC")
    List<ParentTeacherMeeting> findUpcomingByTeacher(@Param("teacherId") UUID teacherId, @Param("now") LocalDateTime now);
    
    @Query("SELECT m FROM ParentTeacherMeeting m WHERE m.parentId = :parentId AND m.scheduledAt > :now AND m.status != 'CANCELLED' ORDER BY m.scheduledAt ASC")
    List<ParentTeacherMeeting> findUpcomingByParent(@Param("parentId") UUID parentId, @Param("now") LocalDateTime now);
    
    @Query("SELECT m FROM ParentTeacherMeeting m WHERE m.status = :status")
    List<ParentTeacherMeeting> findByStatus(@Param("status") String status);
    
    @Query("SELECT m FROM ParentTeacherMeeting m WHERE m.scheduledAt BETWEEN :start AND :end")
    List<ParentTeacherMeeting> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT m FROM ParentTeacherMeeting m WHERE m.teacherId = :teacherId AND m.scheduledAt BETWEEN :start AND :end")
    List<ParentTeacherMeeting> findTeacherSchedule(@Param("teacherId") UUID teacherId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT m FROM ParentTeacherMeeting m WHERE m.followUpRequired = true AND m.followUpDate <= :now")
    List<ParentTeacherMeeting> findPendingFollowUps(@Param("now") LocalDateTime now);
    
    @Query("SELECT m FROM ParentTeacherMeeting m WHERE m.reminderSent = false AND m.scheduledAt BETWEEN :now AND :reminderTime")
    List<ParentTeacherMeeting> findNeedingReminders(@Param("now") LocalDateTime now, @Param("reminderTime") LocalDateTime reminderTime);
}
