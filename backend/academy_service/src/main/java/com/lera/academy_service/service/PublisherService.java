package com.lera.academy_service.service;
import com.lera.academy_service.entity.Publisher;
import com.lera.academy_service.repository.PublisherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class PublisherService {
    private final PublisherRepository repo;
    public Page<Publisher> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<Publisher> getById(UUID id) { return repo.findById(id); }
    @Transactional public Publisher save(Publisher e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
