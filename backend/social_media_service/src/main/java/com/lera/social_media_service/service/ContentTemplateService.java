package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.ContentTemplate;
import com.lera.social_media_service.repository.ContentTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ContentTemplateService {
    private final ContentTemplateRepository repo;

    @Cacheable("contentTemplates")
    public Page<ContentTemplate> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<ContentTemplate> getById(UUID id) { return repo.findById(id); }
    public List<ContentTemplate> getActive() { return repo.findByIsActiveTrueOrderByUseCountDesc(); }
    public List<ContentTemplate> getByType(String type) { return repo.findByTemplateType(type); }
    public List<ContentTemplate> getByCategory(String cat) { return repo.findByCategory(cat); }
    public List<ContentTemplate> getByCreator(UUID createdBy) { return repo.findByCreatedBy(createdBy); }

    @CacheEvict(value = "contentTemplates", allEntries = true) @Transactional
    public ContentTemplate save(ContentTemplate entity) { return repo.save(entity); }

    @CacheEvict(value = "contentTemplates", allEntries = true) @Transactional
    public void deleteById(UUID id) { repo.deleteById(id); }
}
