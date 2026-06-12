package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class LibraryController {

    @GetMapping("/books")
    public ResponseEntity<List<Map<String, Object>>> getBooks(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean available) {
        
        List<Map<String, Object>> books = new ArrayList<>();
        
        String[] titles = {
            "English Grammar Essentials", "Advanced Writing Techniques", "Business English",
            "Literature Classics", "Vocabulary Builder", "Academic Writing Guide",
            "Speaking Skills", "Reading Comprehension", "IELTS Preparation", "TOEFL Guide"
        };
        
        String[] authors = {"John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis"};
        String[] categories = {"Grammar", "Writing", "Speaking", "Reading", "Test Prep"};
        
        for (int i = 0; i < titles.length; i++) {
            Map<String, Object> book = new HashMap<>();
            book.put("id", UUID.randomUUID().toString());
            book.put("title", titles[i]);
            book.put("author", authors[i % authors.length]);
            book.put("isbn", "978-3-16-148410-" + (100 + i));
            book.put("category", categories[i % categories.length]);
            book.put("publisher", "LERA Publications");
            book.put("publishedYear", 2020 + (i % 5));
            book.put("totalCopies", 10 + (i % 5));
            book.put("availableCopies", 5 + (i % 6));
            book.put("location", "Shelf " + ((char)('A' + (i % 5))) + "-" + ((i % 10) + 1));
            book.put("coverImage", "/images/books/book-" + (i + 1) + ".jpg");
            book.put("description", "An excellent resource for English learners.");
            book.put("isAvailable", (i % 3) != 0);
            books.add(book);
        }
        
        return ResponseEntity.ok(books);
    }

    @GetMapping("/books/{id}")
    public ResponseEntity<Map<String, Object>> getBookById(@PathVariable String id) {
        Map<String, Object> book = new HashMap<>();
        book.put("id", id);
        book.put("title", "English Grammar Essentials");
        book.put("author", "John Smith");
        book.put("isbn", "978-3-16-148410-100");
        book.put("category", "Grammar");
        book.put("publisher", "LERA Publications");
        book.put("publishedYear", 2023);
        book.put("totalCopies", 10);
        book.put("availableCopies", 6);
        book.put("location", "Shelf A-5");
        book.put("coverImage", "/images/books/grammar.jpg");
        book.put("description", "Comprehensive guide to English grammar for all levels.");
        book.put("isAvailable", true);
        book.put("pages", 350);
        book.put("language", "English");
        
        return ResponseEntity.ok(book);
    }

    @GetMapping("/borrowed")
    public ResponseEntity<List<Map<String, Object>>> getBorrowedBooks(
            @RequestParam(required = false) String userId) {
        
        List<Map<String, Object>> borrowed = new ArrayList<>();
        
        for (int i = 1; i <= 3; i++) {
            Map<String, Object> record = new HashMap<>();
            record.put("id", UUID.randomUUID().toString());
            record.put("bookId", "book-" + i);
            record.put("bookTitle", "English Book " + i);
            record.put("bookAuthor", "Author " + i);
            record.put("userId", userId != null ? userId : "user-1");
            record.put("userName", "Student " + i);
            record.put("borrowDate", LocalDate.now().minusDays(i * 5));
            record.put("dueDate", LocalDate.now().plusDays(14 - (i * 5)));
            record.put("status", i == 3 ? "OVERDUE" : "BORROWED");
            record.put("renewCount", i - 1);
            record.put("maxRenewals", 2);
            borrowed.add(record);
        }
        
        return ResponseEntity.ok(borrowed);
    }

    @PostMapping("/borrow")
    public ResponseEntity<Map<String, Object>> borrowBook(@Valid @RequestBody Map<String, Object> request) {
        Map<String, Object> borrow = new HashMap<>(request);
        borrow.put("id", UUID.randomUUID().toString());
        borrow.put("borrowDate", LocalDate.now());
        borrow.put("dueDate", LocalDate.now().plusDays(14));
        borrow.put("status", "BORROWED");
        borrow.put("renewCount", 0);
        
        return ResponseEntity.ok(borrow);
    }

    @PostMapping("/return/{borrowId}")
    public ResponseEntity<Map<String, Object>> returnBook(@PathVariable String borrowId) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", borrowId);
        result.put("status", "RETURNED");
        result.put("returnDate", LocalDate.now());
        result.put("fine", 0.0);
        result.put("message", "Book returned successfully");
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/renew/{borrowId}")
    public ResponseEntity<Map<String, Object>> renewBook(@PathVariable String borrowId) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", borrowId);
        result.put("newDueDate", LocalDate.now().plusDays(14));
        result.put("renewCount", 1);
        result.put("message", "Book renewed successfully");
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/reservations")
    public ResponseEntity<List<Map<String, Object>>> getReservations(
            @RequestParam(required = false) String userId) {
        
        List<Map<String, Object>> reservations = new ArrayList<>();
        
        for (int i = 1; i <= 2; i++) {
            Map<String, Object> res = new HashMap<>();
            res.put("id", UUID.randomUUID().toString());
            res.put("bookId", "book-" + (i + 5));
            res.put("bookTitle", "Reserved Book " + i);
            res.put("userId", userId != null ? userId : "user-1");
            res.put("reservationDate", LocalDateTime.now().minusDays(i));
            res.put("expiryDate", LocalDateTime.now().plusDays(3));
            res.put("status", "ACTIVE");
            res.put("queuePosition", i);
            reservations.add(res);
        }
        
        return ResponseEntity.ok(reservations);
    }

    @PostMapping("/reserve")
    public ResponseEntity<Map<String, Object>> reserveBook(@Valid @RequestBody Map<String, Object> request) {
        Map<String, Object> reservation = new HashMap<>(request);
        reservation.put("id", UUID.randomUUID().toString());
        reservation.put("reservationDate", LocalDateTime.now());
        reservation.put("expiryDate", LocalDateTime.now().plusDays(3));
        reservation.put("status", "ACTIVE");
        reservation.put("queuePosition", 1);
        
        return ResponseEntity.ok(reservation);
    }

    @DeleteMapping("/reservations/{id}")
    public ResponseEntity<?> cancelReservation(@PathVariable String id) {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/fines")
    public ResponseEntity<List<Map<String, Object>>> getFines(
            @RequestParam(required = false) String userId) {
        
        List<Map<String, Object>> fines = new ArrayList<>();
        
        Map<String, Object> fine = new HashMap<>();
        fine.put("id", UUID.randomUUID().toString());
        fine.put("userId", userId != null ? userId : "user-1");
        fine.put("bookTitle", "Overdue Book");
        fine.put("daysOverdue", 5);
        fine.put("fineAmount", 2.50);
        fine.put("status", "UNPAID");
        fine.put("createdAt", LocalDateTime.now().minusDays(5));
        fines.add(fine);
        
        return ResponseEntity.ok(fines);
    }

    @PostMapping("/fines/{id}/pay")
    public ResponseEntity<Map<String, Object>> payFine(@PathVariable String id) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", id);
        result.put("status", "PAID");
        result.put("paidAt", LocalDateTime.now());
        result.put("message", "Fine paid successfully");
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getLibraryStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBooks", 2500);
        stats.put("availableBooks", 2150);
        stats.put("borrowedBooks", 350);
        stats.put("activeMembers", 450);
        stats.put("overdueBooks", 25);
        stats.put("reservations", 45);
        stats.put("totalFines", 125.50);
        
        return ResponseEntity.ok(stats);
    }
}
