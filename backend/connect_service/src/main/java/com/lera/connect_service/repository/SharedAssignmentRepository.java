package com.lera.connect_service.repository;

import com.lera.connect_service.entity.SharedAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SharedAssignmentRepository extends JpaRepository<SharedAssignment, UUID> {
    
    List<SharedAssignment> findByConversationId(UUID conversationId);
    
    List<SharedAssignment> findByClassId(UUID classId);
    
    List<SharedAssignment> findBySharedById(UUID sharedById);
    
    @Query("SELECT a FROM SharedAssignment a WHERE a.conversationId = :convId AND a.isPublished = true ORDER BY a.createdAt DESC")
    List<SharedAssignment> findPublishedByConversation(@Param("convId") UUID conversationId);
    
    @Query("SELECT a FROM SharedAssignment a WHERE a.classId = :classId AND a.dueDate > :now ORDER BY a.dueDate ASC")
    List<SharedAssignment> findUpcomingByClass(@Param("classId") UUID classId, @Param("now") LocalDateTime now);
    
    @Query("SELECT a FROM SharedAssignment a WHERE a.assignmentType = :type AND a.classId = :classId")
    List<SharedAssignment> findByTypeAndClass(@Param("type") String type, @Param("classId") UUID classId);
    
    List<SharedAssignment> findBySubject(String subject);
}
