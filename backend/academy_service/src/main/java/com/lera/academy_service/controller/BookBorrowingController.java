package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.BookBorrowing;
import com.lera.academy_service.repository.BookBorrowingRepository;
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
@RequestMapping("/api/book-borrowings")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class BookBorrowingController {

    private final BookBorrowingRepository bookBorrowingRepository;

    @GetMapping
    public ResponseEntity<List<BookBorrowing>> getAll(Pageable pageable) {
        return ResponseEntity.ok(bookBorrowingRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookBorrowing> getById(@PathVariable UUID id) {
        return bookBorrowingRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BookBorrowing> create(@Valid @RequestBody BookBorrowing bookBorrowing) {
        return ResponseEntity.ok(bookBorrowingRepository.save(bookBorrowing));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookBorrowing> update(@PathVariable UUID id, @Valid @RequestBody BookBorrowing bookBorrowing) {
        return bookBorrowingRepository.findById(id)
                .map(existing -> {
                    bookBorrowing.setId(id);
                    return ResponseEntity.ok(bookBorrowingRepository.save(bookBorrowing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (bookBorrowingRepository.existsById(id)) {
            bookBorrowingRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
