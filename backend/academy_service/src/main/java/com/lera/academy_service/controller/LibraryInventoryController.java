package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.LibraryInventory;
import com.lera.academy_service.repository.LibraryInventoryRepository;
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
@RequestMapping("/api/library-inventory")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class LibraryInventoryController {

    private final LibraryInventoryRepository libraryInventoryRepository;

    @GetMapping
    public ResponseEntity<List<LibraryInventory>> getAll(Pageable pageable) {
        return ResponseEntity.ok(libraryInventoryRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LibraryInventory> getById(@PathVariable UUID id) {
        return libraryInventoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LibraryInventory> create(@Valid @RequestBody LibraryInventory libraryInventory) {
        return ResponseEntity.ok(libraryInventoryRepository.save(libraryInventory));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LibraryInventory> update(@PathVariable UUID id, @Valid @RequestBody LibraryInventory libraryInventory) {
        return libraryInventoryRepository.findById(id)
                .map(existing -> {
                    libraryInventory.setId(id);
                    return ResponseEntity.ok(libraryInventoryRepository.save(libraryInventory));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (libraryInventoryRepository.existsById(id)) {
            libraryInventoryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
