package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.CertificateTemplate;
import com.lera.academy_service.repository.CertificateTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/certificate-templates")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class CertificateTemplateController {
    
    private final CertificateTemplateRepository certificateTemplateRepository;
    
    @GetMapping
    public ResponseEntity<List<CertificateTemplate>> getAllTemplates(Pageable pageable) {
        return ResponseEntity.ok(certificateTemplateRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CertificateTemplate> getTemplateById(@PathVariable UUID id) {
        return certificateTemplateRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/type/{templateType}")
    public ResponseEntity<List<CertificateTemplate>> getTemplatesByType(@PathVariable String templateType) {
        return ResponseEntity.ok(certificateTemplateRepository.findByTemplateType(templateType));
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<CertificateTemplate>> getActiveTemplates() {
        return ResponseEntity.ok(certificateTemplateRepository.findByIsActiveTrue());
    }
    
    @PostMapping
    public ResponseEntity<CertificateTemplate> createTemplate(@Valid @RequestBody CertificateTemplate template) {
        return ResponseEntity.ok(certificateTemplateRepository.save(template));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CertificateTemplate> updateTemplate(@PathVariable UUID id, @Valid @RequestBody CertificateTemplate details) {
        return certificateTemplateRepository.findById(id).map(template -> {
            if (details.getTemplateName() != null) template.setTemplateName(details.getTemplateName());
            if (details.getDescription() != null) template.setDescription(details.getDescription());
            if (details.getTemplateType() != null) template.setTemplateType(details.getTemplateType());
            if (details.getTemplateUrl() != null) template.setTemplateUrl(details.getTemplateUrl());
            if (details.getHtmlTemplate() != null) template.setHtmlTemplate(details.getHtmlTemplate());
            if (details.getIsActive() != null) template.setIsActive(details.getIsActive());
            return ResponseEntity.ok(certificateTemplateRepository.save(template));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID id) {
        if (certificateTemplateRepository.existsById(id)) {
            certificateTemplateRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
