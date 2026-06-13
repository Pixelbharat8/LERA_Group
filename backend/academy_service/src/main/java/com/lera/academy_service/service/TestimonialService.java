package com.lera.academy_service.service;
import com.lera.academy_service.entity.Testimonial;
import com.lera.academy_service.repository.TestimonialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class TestimonialService {
    private final TestimonialRepository repo;
    @Cacheable("testimonials") public Page<Testimonial> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<Testimonial> getById(UUID id) { return repo.findById(id); }
    @Transactional @CacheEvict(value="testimonials",allEntries=true) public Testimonial save(Testimonial e) { return repo.save(e); }
    @Transactional @CacheEvict(value="testimonials",allEntries=true) public void deleteById(UUID id) { repo.deleteById(id); }
}
