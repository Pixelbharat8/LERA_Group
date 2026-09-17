package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Author;
import com.lera.academy_service.entity.Book;
import com.lera.academy_service.entity.BookCategory;
import com.lera.academy_service.entity.Publisher;
import com.lera.academy_service.repository.AuthorRepository;
import com.lera.academy_service.repository.BookBorrowingRepository;
import com.lera.academy_service.repository.BookCategoryRepository;
import com.lera.academy_service.repository.BookRepository;
import com.lera.academy_service.repository.BookReservationRepository;
import com.lera.academy_service.repository.LibraryFineRepository;
import com.lera.academy_service.repository.PublisherRepository;
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
    private final AuthorRepository authorRepository;
    private final BookCategoryRepository bookCategoryRepository;
    private final PublisherRepository publisherRepository;

    private static final String CIRCULATION_TODO =
            "Library circulation (borrow/return/renew/reserve/pay) is not implemented yet; nothing was changed.";

    /**
     * Book rows carry only author/category/publisher IDs. Every page that lists books needs the
     * NAMES, so resolve them here in three batched queries rather than leaving the UI to render
     * blanks (it previously read b.author / b.category, keys this endpoint never returned).
     * Mirrors the same enrichment on ClassController#withDisplayNames.
     */
    private static UUID parseUuid(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private static void collect(Set<UUID> target, String raw) {
        UUID id = parseUuid(raw);
        if (id != null) target.add(id);
    }

    /** Resolved display names for one batch of books, keyed by the id string the book carries. */
    private record BookNames(Map<UUID, String> authors,
                             Map<UUID, String> categories,
                             Map<UUID, String> publishers) {
        static final BookNames EMPTY = new BookNames(Map.of(), Map.of(), Map.of());
    }

    private BookNames lookupNames(List<Book> books) {
        if (books.isEmpty()) return BookNames.EMPTY;
        Set<UUID> authorIds = new HashSet<>();
        Set<UUID> categoryIds = new HashSet<>();
        Set<UUID> publisherIds = new HashSet<>();
        for (Book b : books) {
            collect(authorIds, b.getAuthorId());
            collect(categoryIds, b.getCategoryId());
            collect(publisherIds, b.getPublisherId());
        }
        Map<UUID, String> authors = new HashMap<>();
        if (!authorIds.isEmpty()) {
            for (Author a : authorRepository.findAllById(authorIds)) authors.put(a.getId(), a.getName());
        }
        Map<UUID, String> categories = new HashMap<>();
        if (!categoryIds.isEmpty()) {
            for (BookCategory c : bookCategoryRepository.findAllById(categoryIds)) categories.put(c.getId(), c.getName());
        }
        Map<UUID, String> publishers = new HashMap<>();
        if (!publisherIds.isEmpty()) {
            for (Publisher pub : publisherRepository.findAllById(publisherIds)) publishers.put(pub.getId(), pub.getName());
        }
        return new BookNames(authors, categories, publishers);
    }

    private static String nameOf(Map<UUID, String> names, String rawId) {
        UUID id = parseUuid(rawId);
        return id == null ? null : names.get(id);
    }

    private Map<String, Object> toBook(Book b) {
        return toBook(b, BookNames.EMPTY);
    }

    private Map<String, Object> toBook(Book b, BookNames names) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", b.getId());
        m.put("title", b.getTitle());
        m.put("titleVi", b.getTitleVi());
        m.put("isbn", b.getIsbn());
        m.put("authorId", b.getAuthorId());
        m.put("author", nameOf(names.authors(), b.getAuthorId()));
        m.put("categoryId", b.getCategoryId());
        m.put("category", nameOf(names.categories(), b.getCategoryId()));
        m.put("publisherId", b.getPublisherId());
        m.put("publisher", nameOf(names.publishers(), b.getPublisherId()));
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
        List<Book> visible = new ArrayList<>();
        for (Book b : books) {
            if (Boolean.TRUE.equals(available)
                    && !(b.getAvailableCopies() != null && b.getAvailableCopies() > 0)) {
                continue;
            }
            visible.add(b);
        }
        BookNames names = lookupNames(visible);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Book b : visible) {
            out.add(toBook(b, names));
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/books/{id}")
    public ResponseEntity<Map<String, Object>> getBookById(@PathVariable String id) {
        return bookRepository.findById(id)
                .map(b -> ResponseEntity.ok(toBook(b, lookupNames(List.of(b)))))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/borrowed")
    public ResponseEntity<?> getBorrowedBooks(@RequestParam(required = false) String studentId) {
        UUID student = parseUuid(studentId);
        if (student != null) return ResponseEntity.ok(bookBorrowingRepository.findByStudentId(student));
        if (studentId != null && !studentId.isBlank()) return ResponseEntity.ok(List.of());
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
    public ResponseEntity<?> getReservations(@RequestParam(required = false) String studentId) {
        UUID student = parseUuid(studentId);
        if (student != null) return ResponseEntity.ok(bookReservationRepository.findByStudentId(student));
        if (studentId != null && !studentId.isBlank()) return ResponseEntity.ok(List.of());
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
    public ResponseEntity<?> getFines(@RequestParam(required = false) String studentId) {
        UUID student = parseUuid(studentId);
        if (student != null) return ResponseEntity.ok(libraryFineRepository.findByStudentId(student));
        if (studentId != null && !studentId.isBlank()) return ResponseEntity.ok(List.of());
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
