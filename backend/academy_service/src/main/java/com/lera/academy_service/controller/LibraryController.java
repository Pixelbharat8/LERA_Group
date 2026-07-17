package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Book;
import com.lera.academy_service.repository.BookBorrowingRepository;
import com.lera.academy_service.repository.BookRepository;
import com.lera.academy_service.repository.BookReservationRepository;
import com.lera.academy_service.repository.LibraryFineRepository;
import com.lera.academy_service.security.AcademyRoles;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.*;

/**
 * Library catalogue &amp; circulation. Previously this controller fabricated every response
 * (canned book titles, hardcoded stats totalBooks=2500/activeMembers=450, fake fines) and
 * persisted nothing. Now the reads are backed by the REAL repositories (Book, BookBorrowing,
 * BookReservation, LibraryFine). Circulation writes (borrow/return/renew/reserve/pay) require
 * real inventory + fine business logic and return 501 until that is implemented — no fabricated
 * success responses.
 */
@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class LibraryController {

    private final BookRepository bookRepository;
    private final BookBorrowingRepository bookBorrowingRepository;
    private final BookReservationRepository bookReservationRepository;
    private final LibraryFineRepository libraryFineRepository;

    private static final String CIRCULATION_TODO =
            "Library circulation (borrow/return/renew/reserve/pay) is not implemented yet; nothing was changed.";

    private Map<String, Object> toBook(Book b) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", b.getId());
        m.put("title", b.getTitle());
        m.put("titleVi", b.getTitleVi());
        m.put("isbn", b.getIsbn());
        m.put("authorId", b.getAuthorId());
        m.put("categoryId", b.getCategoryId());
        m.put("publisherId", b.getPublisherId());
        m.put("publishedYear", b.getPublicationYear());
        m.put("edition", b.getEdition());
        m.put("language", b.getLanguage());
        m.put("pages", b.getPages());
        m.put("price", b.getPrice());
        m.put("totalCopies", b.getTotalCopies());
        m.put("availableCopies", b.getAvailableCopies());
        m.put("location", b.getLocation());
        m.put("coverImage", b.getCoverImageUrl());
        m.put("description", b.getDescription());
        m.put("isAvailable", b.getAvailableCopies() != null && b.getAvailableCopies() > 0);
        return m;
    }

    @GetMapping("/books")
    public ResponseEntity<List<Map<String, Object>>> getBooks(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean available) {
        List<Book> books;
        if (search != null && !search.isBlank()) {
            books = bookRepository.findByTitleContainingIgnoreCase(search);
        } else if (category != null && !category.isBlank()) {
            books = bookRepository.findByCategoryId(category);
        } else {
            books = bookRepository.findByIsActive(true);
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Book b : books) {
            if (Boolean.TRUE.equals(available)
                    && !(b.getAvailableCopies() != null && b.getAvailableCopies() > 0)) {
                continue;
            }
            out.add(toBook(b));
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/books/{id}")
    public ResponseEntity<Map<String, Object>> getBookById(@PathVariable String id) {
        return bookRepository.findById(id)
                .map(b -> ResponseEntity.ok(toBook(b)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/borrowed")
    public ResponseEntity<?> getBorrowedBooks(@RequestParam(required = false) String userId) {
        return ResponseEntity.ok(bookBorrowingRepository.findAll());
    }

    @PostMapping("/borrow")
    public ResponseEntity<Map<String, Object>> borrowBook(@Valid @RequestBody Map<String, Object> request) {
        return circulationNotImplemented();
    }

    @PostMapping("/return/{borrowId}")
    public ResponseEntity<Map<String, Object>> returnBook(@PathVariable String borrowId) {
        return circulationNotImplemented();
    }

    @PostMapping("/renew/{borrowId}")
    public ResponseEntity<Map<String, Object>> renewBook(@PathVariable String borrowId) {
        return circulationNotImplemented();
    }

    @GetMapping("/reservations")
    public ResponseEntity<?> getReservations(@RequestParam(required = false) String userId) {
        return ResponseEntity.ok(bookReservationRepository.findAll());
    }

    @PostMapping("/reserve")
    public ResponseEntity<Map<String, Object>> reserveBook(@Valid @RequestBody Map<String, Object> request) {
        return circulationNotImplemented();
    }

    @DeleteMapping("/reservations/{id}")
    public ResponseEntity<Map<String, Object>> cancelReservation(@PathVariable String id) {
        return circulationNotImplemented();
    }

    @GetMapping("/fines")
    public ResponseEntity<?> getFines(@RequestParam(required = false) String userId) {
        return ResponseEntity.ok(libraryFineRepository.findAll());
    }

    @PostMapping("/fines/{id}/pay")
    public ResponseEntity<Map<String, Object>> payFine(@PathVariable String id) {
        return circulationNotImplemented();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getLibraryStats() {
        Map<String, Object> stats = new HashMap<>();
        long totalBooks = bookRepository.count();
        stats.put("totalBooks", totalBooks);
        stats.put("borrowedRecords", bookBorrowingRepository.count());
        stats.put("reservations", bookReservationRepository.count());
        stats.put("fines", libraryFineRepository.count());
        return ResponseEntity.ok(stats);
    }

    private ResponseEntity<Map<String, Object>> circulationNotImplemented() {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of("error", CIRCULATION_TODO));
    }
}
