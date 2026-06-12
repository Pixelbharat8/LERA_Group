package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.BookReservation;
import com.lera.academy_service.repository.BookReservationRepository;
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
@RequestMapping("/api/book-reservations")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class BookReservationController {

    private final BookReservationRepository bookReservationRepository;

    @GetMapping
    public ResponseEntity<List<BookReservation>> getAll(Pageable pageable) {
        return ResponseEntity.ok(bookReservationRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookReservation> getById(@PathVariable UUID id) {
        return bookReservationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BookReservation> create(@Valid @RequestBody BookReservation bookReservation) {
        return ResponseEntity.ok(bookReservationRepository.save(bookReservation));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookReservation> update(@PathVariable UUID id, @Valid @RequestBody BookReservation bookReservation) {
        return bookReservationRepository.findById(id)
                .map(existing -> {
                    bookReservation.setId(id);
                    return ResponseEntity.ok(bookReservationRepository.save(bookReservation));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (bookReservationRepository.existsById(id)) {
            bookReservationRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
