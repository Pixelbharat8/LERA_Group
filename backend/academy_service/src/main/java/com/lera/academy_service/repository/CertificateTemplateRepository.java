package com.lera.academy_service.repository;

import com.lera.academy_service.entity.CertificateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CertificateTemplateRepository extends JpaRepository<CertificateTemplate, UUID> {
    Optional<CertificateTemplate> findByTemplateName(String templateName);
    List<CertificateTemplate> findByTemplateType(String templateType);
    List<CertificateTemplate> findByIsActive(Boolean isActive);
    List<CertificateTemplate> findByIsActiveTrue();
    List<CertificateTemplate> findByIsDefault(Boolean isDefault);
}
