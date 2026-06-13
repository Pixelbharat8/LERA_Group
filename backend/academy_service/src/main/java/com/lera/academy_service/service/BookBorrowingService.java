package com.lera.academy_service.service;
import com.lera.academy_service.entity.BookBorrowing;
import com.lera.academy_service.repository.BookBorrowingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class BookBorrowingService {
    private final BookBorrowingRepository repo;
    public Page<BookBorrowing> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<BookBorrowing> getById(UUID id) { return repo.findById(id); }
    @Transactional public BookBorrowing save(BookBorrowing e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
