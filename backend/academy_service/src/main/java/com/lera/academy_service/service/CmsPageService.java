package com.lera.academy_service.service;
import com.lera.academy_service.entity.CmsPage;
import com.lera.academy_service.repository.CmsPageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class CmsPageService {
    private final CmsPageRepository repo;
    public Page<CmsPage> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<CmsPage> getById(UUID id) { return repo.findById(id); }
    @Transactional public CmsPage save(CmsPage e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
