package com.lera.academy_service.service;
import com.lera.academy_service.entity.Book;
import com.lera.academy_service.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class BookService {
    private final BookRepository repo;
    public Page<Book> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<Book> getById(String id) { return repo.findById(id); }
    @Transactional public Book save(Book e) { return repo.save(e); }
    @Transactional public void deleteById(String id) { repo.deleteById(id); }
}
