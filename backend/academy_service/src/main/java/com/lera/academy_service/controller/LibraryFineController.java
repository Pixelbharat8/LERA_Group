package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.LibraryFine;
import com.lera.academy_service.repository.LibraryFineRepository;
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
@RequestMapping("/api/library-fines")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class LibraryFineController {

    private final LibraryFineRepository libraryFineRepository;

    @GetMapping
    public ResponseEntity<List<LibraryFine>> getAll(Pageable pageable) {
        return ResponseEntity.ok(libraryFineRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LibraryFine> getById(@PathVariable UUID id) {
        return libraryFineRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LibraryFine> create(@Valid @RequestBody LibraryFine libraryFine) {
        return ResponseEntity.ok(libraryFineRepository.save(libraryFine));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LibraryFine> update(@PathVariable UUID id, @Valid @RequestBody LibraryFine libraryFine) {
        return libraryFineRepository.findById(id)
                .map(existing -> {
                    libraryFine.setId(id);
                    return ResponseEntity.ok(libraryFineRepository.save(libraryFine));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (libraryFineRepository.existsById(id)) {
            libraryFineRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
