package com.lera.connect_service.repository;

import com.lera.connect_service.entity.ClassGroupChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassGroupChatRepository extends JpaRepository<ClassGroupChat, UUID> {
    
    List<ClassGroupChat> findByAcademyId(UUID academyId);
    
    Optional<ClassGroupChat> findByClassId(UUID classId);
    
    List<ClassGroupChat> findByAcademyIdAndIsActiveTrue(UUID academyId);
    
    List<ClassGroupChat> findByGroupType(String groupType);
    
    @Query("SELECT c FROM ClassGroupChat c WHERE c.academyId = :academyId AND c.academicYear = :year")
    List<ClassGroupChat> findByAcademyAndYear(@Param("academyId") UUID academyId, @Param("year") String year);
    
    @Query("SELECT c FROM ClassGroupChat c WHERE c.gradeLevel = :grade AND c.academyId = :academyId")
    List<ClassGroupChat> findByGradeLevel(@Param("academyId") UUID academyId, @Param("grade") String grade);
    
    boolean existsByClassId(UUID classId);
}
