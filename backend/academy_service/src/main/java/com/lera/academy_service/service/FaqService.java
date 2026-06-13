package com.lera.academy_service.service;
import com.lera.academy_service.entity.Faq;
import com.lera.academy_service.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class FaqService {
    private final FaqRepository repo;
    public Page<Faq> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<Faq> getById(UUID id) { return repo.findById(id); }
    @Transactional public Faq save(Faq e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
