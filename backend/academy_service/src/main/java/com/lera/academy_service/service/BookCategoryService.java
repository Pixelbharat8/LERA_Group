package com.lera.academy_service.service;
import com.lera.academy_service.entity.BookCategory;
import com.lera.academy_service.repository.BookCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class BookCategoryService {
    private final BookCategoryRepository repo;
    public Page<BookCategory> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<BookCategory> getById(UUID id) { return repo.findById(id); }
    @Transactional public BookCategory save(BookCategory e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
