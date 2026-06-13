package com.lera.academy_service.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lera.academy_service.entity.TeacherDocument;

@Repository
public interface TeacherDocumentRepository extends JpaRepository<TeacherDocument, UUID> {

    List<TeacherDocument> findByTeacherId(UUID teacherId);

    List<TeacherDocument> findByTeacherIdAndDocumentType(UUID teacherId, String documentType);

    List<TeacherDocument> findByTeacherIdAndIsVerifiedTrue(UUID teacherId);

    List<TeacherDocument> findByExpiryDateBefore(LocalDate date);
}
