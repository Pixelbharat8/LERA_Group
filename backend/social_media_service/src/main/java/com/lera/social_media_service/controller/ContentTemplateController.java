package com.lera.social_media_service.controller;

import com.lera.social_media_service.entity.ContentTemplate;
import com.lera.social_media_service.repository.ContentTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/content-templates")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class ContentTemplateController {
    
    private final ContentTemplateRepository contentTemplateRepository;
    
    @GetMapping
    public ResponseEntity<List<ContentTemplate>> getAllTemplates() {
        return ResponseEntity.ok(contentTemplateRepository.findByIsActiveTrueOrderByUseCountDesc());
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<ContentTemplate>> getAllTemplatesIncludingInactive(Pageable pageable) {
        return ResponseEntity.ok(contentTemplateRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ContentTemplate> getTemplateById(@PathVariable UUID id) {
        return contentTemplateRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<ContentTemplate>> getTemplatesByType(@PathVariable String type) {
        return ResponseEntity.ok(contentTemplateRepository.findByTemplateType(type));
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<ContentTemplate>> getTemplatesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(contentTemplateRepository.findByCategoryAndIsActiveTrue(category));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ContentTemplate>> getTemplatesByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(contentTemplateRepository.findByCreatedBy(userId));
    }
    
    @PostMapping
    public ResponseEntity<ContentTemplate> createTemplate(@Valid @RequestBody ContentTemplate template) {
        template.setCreatedAt(LocalDateTime.now());
        template.setUpdatedAt(LocalDateTime.now());
        template.setUseCount(0);
        return ResponseEntity.ok(contentTemplateRepository.save(template));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ContentTemplate> updateTemplate(@PathVariable UUID id, @Valid @RequestBody ContentTemplate details) {
        return contentTemplateRepository.findById(id).map(template -> {
            if (details.getName() != null) template.setName(details.getName());
            if (details.getDescription() != null) template.setDescription(details.getDescription());
            if (details.getTemplateType() != null) template.setTemplateType(details.getTemplateType());
            if (details.getContentTemplate() != null) template.setContentTemplate(details.getContentTemplate());
            if (details.getMediaUrls() != null) template.setMediaUrls(details.getMediaUrls());
            if (details.getHashtags() != null) template.setHashtags(details.getHashtags());
            if (details.getPlatforms() != null) template.setPlatforms(details.getPlatforms());
            if (details.getCategory() != null) template.setCategory(details.getCategory());
            if (details.getIsActive() != null) template.setIsActive(details.getIsActive());
            template.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(contentTemplateRepository.save(template));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/use")
    public ResponseEntity<ContentTemplate> incrementUseCount(@PathVariable UUID id) {
        return contentTemplateRepository.findById(id).map(template -> {
            template.setUseCount(template.getUseCount() + 1);
            template.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(contentTemplateRepository.save(template));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID id) {
        if (contentTemplateRepository.existsById(id)) {
            contentTemplateRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
