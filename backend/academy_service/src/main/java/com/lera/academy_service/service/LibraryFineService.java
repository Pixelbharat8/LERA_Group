package com.lera.academy_service.service;
import com.lera.academy_service.entity.LibraryFine;
import com.lera.academy_service.repository.LibraryFineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class LibraryFineService {
    private final LibraryFineRepository repo;
    public Page<LibraryFine> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<LibraryFine> getById(UUID id) { return repo.findById(id); }
    @Transactional public LibraryFine save(LibraryFine e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
