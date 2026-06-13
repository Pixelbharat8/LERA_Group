package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.CmsPage;
import com.lera.academy_service.repository.CmsPageRepository;
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
@RequestMapping("/api/cms-pages")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class CmsPageController {
    
    private final CmsPageRepository cmsPageRepository;
    
    @GetMapping
    public ResponseEntity<List<CmsPage>> getAllPages(Pageable pageable) {
        return ResponseEntity.ok(cmsPageRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CmsPage> getPageById(@PathVariable UUID id) {
        return cmsPageRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/slug/{slug}")
    public ResponseEntity<CmsPage> getPageBySlug(@PathVariable String slug) {
        return cmsPageRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/published")
    public ResponseEntity<List<CmsPage>> getPublishedPages() {
        return ResponseEntity.ok(cmsPageRepository.findByIsPublishedTrue());
    }
    
    @PostMapping
    public ResponseEntity<CmsPage> createPage(@Valid @RequestBody CmsPage page) {
        return ResponseEntity.ok(cmsPageRepository.save(page));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CmsPage> updatePage(@PathVariable UUID id, @Valid @RequestBody CmsPage details) {
        return cmsPageRepository.findById(id).map(page -> {
            if (details.getTitleEn() != null) page.setTitleEn(details.getTitleEn());
            if (details.getTitleVi() != null) page.setTitleVi(details.getTitleVi());
            if (details.getSlug() != null) page.setSlug(details.getSlug());
            if (details.getContentEn() != null) page.setContentEn(details.getContentEn());
            if (details.getContentVi() != null) page.setContentVi(details.getContentVi());
            if (details.getMetaTitle() != null) page.setMetaTitle(details.getMetaTitle());
            if (details.getMetaDescription() != null) page.setMetaDescription(details.getMetaDescription());
            if (details.getFeaturedImage() != null) page.setFeaturedImage(details.getFeaturedImage());
            if (details.getIsPublished() != null) page.setIsPublished(details.getIsPublished());
            if (details.getPublishDate() != null) page.setPublishDate(details.getPublishDate());
            return ResponseEntity.ok(cmsPageRepository.save(page));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePage(@PathVariable UUID id) {
        if (cmsPageRepository.existsById(id)) {
            cmsPageRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
