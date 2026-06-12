package com.lera.academy_service.repository;

import com.lera.academy_service.entity.StudentParent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudentParentRepository extends JpaRepository<StudentParent, UUID> {
    
    List<StudentParent> findByStudentId(UUID studentId);
    
    List<StudentParent> findByParentId(UUID parentId);
    
    List<StudentParent> findByStudentIdAndIsPrimaryTrue(UUID studentId);
    
    boolean existsByStudentIdAndParentId(UUID studentId, UUID parentId);
    
    void deleteByStudentIdAndParentId(UUID studentId, UUID parentId);
}
