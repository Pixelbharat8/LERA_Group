package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.BookCategory;
import com.lera.academy_service.repository.BookCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/book-categories")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class BookCategoryController {

    private final BookCategoryRepository bookCategoryRepository;

    @GetMapping
    public ResponseEntity<List<BookCategory>> getAll(Pageable pageable) {
        return ResponseEntity.ok(bookCategoryRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookCategory> getById(@PathVariable UUID id) {
        return bookCategoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BookCategory> create(@Valid @RequestBody BookCategory bookCategory) {
        return ResponseEntity.ok(bookCategoryRepository.save(bookCategory));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookCategory> update(@PathVariable UUID id, @Valid @RequestBody BookCategory bookCategory) {
        return bookCategoryRepository.findById(id)
                .map(existing -> {
                    bookCategory.setId(id);
                    return ResponseEntity.ok(bookCategoryRepository.save(bookCategory));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (bookCategoryRepository.existsById(id)) {
            bookCategoryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
