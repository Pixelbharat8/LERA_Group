package com.lera.academy_service.repository;

import com.lera.academy_service.entity.StudentParent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface StudentParentRepository extends JpaRepository<StudentParent, UUID> {

    List<StudentParent> findByStudentId(UUID studentId);

    /** Links for a set of students — used to centre-scope the list for centre-bound staff. */
    List<StudentParent> findByStudentIdIn(Collection<UUID> studentIds);
    
    List<StudentParent> findByParentId(UUID parentId);
    
    List<StudentParent> findByStudentIdAndIsPrimaryTrue(UUID studentId);
    
    boolean existsByStudentIdAndParentId(UUID studentId, UUID parentId);
    
    void deleteByStudentIdAndParentId(UUID studentId, UUID parentId);
}
