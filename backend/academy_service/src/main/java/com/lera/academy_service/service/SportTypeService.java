package com.lera.academy_service.service;
import com.lera.academy_service.entity.SportType;
import com.lera.academy_service.repository.SportTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class SportTypeService {
    private final SportTypeRepository repo;
    public Page<SportType> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<SportType> getById(UUID id) { return repo.findById(id); }
    @Transactional public SportType save(SportType e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
