package com.lera.academy_service.service;

import com.lera.academy_service.entity.Certificate;
import com.lera.academy_service.repository.CertificateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CertificateService {

    private final CertificateRepository certificateRepository;

    public Certificate issueCertificate(Certificate certificate) {
        if (certificate.getCertificateNumber() == null) {
            certificate.setCertificateNumber(generateCertificateNumber());
        }
        if (certificate.getIssueDate() == null) {
            certificate.setIssueDate(LocalDate.now());
        }
        return certificateRepository.save(certificate);
    }

    public Optional<Certificate> getCertificateById(UUID id) {
        return certificateRepository.findById(id);
    }

    public Optional<Certificate> getCertificateByCertificateNumber(String certificateNumber) {
        return certificateRepository.findByCertificateNumber(certificateNumber);
    }

    public List<Certificate> getStudentCertificates(UUID studentId) {
        return certificateRepository.findByStudentId(studentId);
    }

    public List<Certificate> getCourseCertificates(UUID courseId) {
        return certificateRepository.findByCourseId(courseId);
    }

    public void deleteCertificate(UUID id) {
        certificateRepository.deleteById(id);
    }

    private String generateCertificateNumber() {
        return "CERT-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
