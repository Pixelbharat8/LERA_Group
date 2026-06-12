package com.lera.academy_service.repository;

import com.lera.academy_service.entity.StudentDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface StudentDocumentRepository extends JpaRepository<StudentDocument, UUID> {

    List<StudentDocument> findByStudentId(UUID studentId);

    List<StudentDocument> findByStudentIdAndDocumentType(UUID studentId, String documentType);

    List<StudentDocument> findByStudentIdAndIsVerifiedTrue(UUID studentId);

    List<StudentDocument> findByExpiresAtBefore(LocalDate date);

    long countByStudentId(UUID studentId);
}
