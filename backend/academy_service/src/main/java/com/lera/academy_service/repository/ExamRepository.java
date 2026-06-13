package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExamRepository extends JpaRepository<Exam, UUID> {
    List<Exam> findByClassId(UUID classId);
    List<Exam> findByExamTypeId(UUID examTypeId);
    List<Exam> findByCreatedBy(UUID createdBy);
}
