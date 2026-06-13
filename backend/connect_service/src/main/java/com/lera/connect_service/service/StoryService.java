package com.lera.connect_service.service;

import com.lera.connect_service.entity.Story;
import com.lera.connect_service.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class StoryService {
    private final StoryRepository repo;

    public Page<Story> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<Story> getById(UUID id) { return repo.findById(id); }

    @Transactional public Story save(Story entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
