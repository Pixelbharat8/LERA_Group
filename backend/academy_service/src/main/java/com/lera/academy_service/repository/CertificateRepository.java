package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, UUID> {
    List<Certificate> findByStudentId(UUID studentId);
    List<Certificate> findByCourseId(UUID courseId);
    Optional<Certificate> findByCertificateNumber(String certificateNumber);
    Optional<Certificate> findByVerificationCode(String verificationCode);
    List<Certificate> findByIsRevoked(Boolean isRevoked);
}
