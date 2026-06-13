package com.lera.connect_service.service;

import com.lera.connect_service.entity.SocialMediaPost;
import com.lera.connect_service.repository.SocialMediaPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SocialMediaPostService {
    private final SocialMediaPostRepository repo;

    public Page<SocialMediaPost> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<SocialMediaPost> getById(UUID id) { return repo.findById(id); }
    public List<SocialMediaPost> getByStatus(String status) { return repo.findByStatusOrderByScheduledAtDesc(status); }
    public List<SocialMediaPost> getByCreator(UUID createdBy) { return repo.findByCreatedBy(createdBy); }
    @Transactional public SocialMediaPost save(SocialMediaPost entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
