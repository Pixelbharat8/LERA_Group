package com.lera.academy_service.service;
import com.lera.academy_service.entity.CertificateTemplate;
import com.lera.academy_service.repository.CertificateTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class CertificateTemplateService {
    private final CertificateTemplateRepository repo;
    public Page<CertificateTemplate> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<CertificateTemplate> getById(UUID id) { return repo.findById(id); }
    @Transactional public CertificateTemplate save(CertificateTemplate e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
