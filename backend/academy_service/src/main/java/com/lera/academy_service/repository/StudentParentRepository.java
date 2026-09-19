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

    /**
     * "Is this parent linked to ANY of these students?" in one query. The authorisation path
     * used to ask existsByStudentIdAndParentId once per enrolled student, so a class of 30
     * cost 30 round trips on every access check.
     */
    boolean existsByParentIdAndStudentIdIn(UUID parentId, Collection<UUID> studentIds);
    
    void deleteByStudentIdAndParentId(UUID studentId, UUID parentId);
}
