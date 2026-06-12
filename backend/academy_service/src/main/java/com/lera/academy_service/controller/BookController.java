package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.Book;
import com.lera.academy_service.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class BookController {
    
    private final BookRepository bookRepository;
    
    @GetMapping
    public ResponseEntity<List<Book>> getAllBooks(Pageable pageable) {
        return ResponseEntity.ok(bookRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable String id) {
        return bookRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/isbn/{isbn}")
    public ResponseEntity<Book> getBookByIsbn(@PathVariable String isbn) {
        return bookRepository.findByIsbn(isbn)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Book>> getBooksByCategory(@PathVariable String categoryId) {
        return ResponseEntity.ok(bookRepository.findByCategoryId(categoryId));
    }
    
    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<Book>> getBooksByAuthor(@PathVariable String authorId) {
        return ResponseEntity.ok(bookRepository.findByAuthorId(authorId));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Book>> searchBooks(@RequestParam String q) {
        return ResponseEntity.ok(bookRepository.findByTitleContainingIgnoreCase(q));
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<Book>> getActiveBooks() {
        return ResponseEntity.ok(bookRepository.findByIsActive(true));
    }
    
    @PostMapping
    public ResponseEntity<Book> createBook(@Valid @RequestBody Book book) {
        return ResponseEntity.ok(bookRepository.save(book));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Book> updateBook(@PathVariable String id, @Valid @RequestBody Book bookDetails) {
        return bookRepository.findById(id).map(book -> {
            if (bookDetails.getTitle() != null) book.setTitle(bookDetails.getTitle());
            if (bookDetails.getTitleVi() != null) book.setTitleVi(bookDetails.getTitleVi());
            if (bookDetails.getDescription() != null) book.setDescription(bookDetails.getDescription());
            if (bookDetails.getIsbn() != null) book.setIsbn(bookDetails.getIsbn());
            if (bookDetails.getAuthorId() != null) book.setAuthorId(bookDetails.getAuthorId());
            if (bookDetails.getCategoryId() != null) book.setCategoryId(bookDetails.getCategoryId());
            if (bookDetails.getPublisherId() != null) book.setPublisherId(bookDetails.getPublisherId());
            if (bookDetails.getPublicationYear() != null) book.setPublicationYear(bookDetails.getPublicationYear());
            if (bookDetails.getEdition() != null) book.setEdition(bookDetails.getEdition());
            if (bookDetails.getLanguage() != null) book.setLanguage(bookDetails.getLanguage());
            if (bookDetails.getPages() != null) book.setPages(bookDetails.getPages());
            if (bookDetails.getPrice() != null) book.setPrice(bookDetails.getPrice());
            if (bookDetails.getTotalCopies() != null) book.setTotalCopies(bookDetails.getTotalCopies());
            if (bookDetails.getAvailableCopies() != null) book.setAvailableCopies(bookDetails.getAvailableCopies());
            if (bookDetails.getLocation() != null) book.setLocation(bookDetails.getLocation());
            if (bookDetails.getCoverImageUrl() != null) book.setCoverImageUrl(bookDetails.getCoverImageUrl());
            if (bookDetails.getIsActive() != null) book.setIsActive(bookDetails.getIsActive());
            return ResponseEntity.ok(bookRepository.save(book));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable String id) {
        if (bookRepository.existsById(id)) {
            bookRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PatchMapping("/{id}/borrow")
    public ResponseEntity<Book> borrowBook(@PathVariable String id) {
        return bookRepository.findById(id).<ResponseEntity<Book>>map(book -> {
            if (book.getAvailableCopies() > 0) {
                book.setAvailableCopies(book.getAvailableCopies() - 1);
                return ResponseEntity.ok(bookRepository.save(book));
            }
            return ResponseEntity.<Book>badRequest().build();
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/return")
    public ResponseEntity<Book> returnBook(@PathVariable String id) {
        return bookRepository.findById(id).<ResponseEntity<Book>>map(book -> {
            if (book.getAvailableCopies() < book.getTotalCopies()) {
                book.setAvailableCopies(book.getAvailableCopies() + 1);
                return ResponseEntity.ok(bookRepository.save(book));
            }
            return ResponseEntity.<Book>badRequest().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
