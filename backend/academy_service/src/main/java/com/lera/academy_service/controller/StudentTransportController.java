package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.StudentTransport;
import com.lera.academy_service.repository.StudentTransportRepository;
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
@RequestMapping("/api/student-transport")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class StudentTransportController {

    private final StudentTransportRepository studentTransportRepository;

    @GetMapping
    public ResponseEntity<List<StudentTransport>> getAll(Pageable pageable) {
        return ResponseEntity.ok(studentTransportRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentTransport> getById(@PathVariable UUID id) {
        return studentTransportRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<StudentTransport> create(@Valid @RequestBody StudentTransport studentTransport) {
        return ResponseEntity.ok(studentTransportRepository.save(studentTransport));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentTransport> update(@PathVariable UUID id, @Valid @RequestBody StudentTransport studentTransport) {
        return studentTransportRepository.findById(id)
                .map(existing -> {
                    studentTransport.setId(id);
                    return ResponseEntity.ok(studentTransportRepository.save(studentTransport));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (studentTransportRepository.existsById(id)) {
            studentTransportRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
