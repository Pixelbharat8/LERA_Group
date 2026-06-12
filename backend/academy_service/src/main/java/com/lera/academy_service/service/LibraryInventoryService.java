package com.lera.academy_service.service;
import com.lera.academy_service.entity.LibraryInventory;
import com.lera.academy_service.repository.LibraryInventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class LibraryInventoryService {
    private final LibraryInventoryRepository repo;
    public Page<LibraryInventory> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<LibraryInventory> getById(UUID id) { return repo.findById(id); }
    @Transactional public LibraryInventory save(LibraryInventory e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
