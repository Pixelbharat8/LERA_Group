package com.lera.academy_service.service;

import com.lera.academy_service.entity.BlogPost;
import com.lera.academy_service.repository.BlogPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor
public class BlogPostService {
    private final BlogPostRepository repo;
    public Page<BlogPost> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<BlogPost> getById(UUID id) { return repo.findById(id); }
    @Transactional public BlogPost save(BlogPost e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
