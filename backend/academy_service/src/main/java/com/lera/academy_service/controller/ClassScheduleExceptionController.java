package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.ClassScheduleException;
import com.lera.academy_service.repository.ClassScheduleExceptionRepository;
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
@RequestMapping("/api/class-schedule-exceptions")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class ClassScheduleExceptionController {

    private final ClassScheduleExceptionRepository classScheduleExceptionRepository;

    @GetMapping
    public ResponseEntity<List<ClassScheduleException>> getAll(
            Pageable pageable, @RequestParam(required = false) UUID classId) {
        if (classId != null) {
            return ResponseEntity.ok(classScheduleExceptionRepository.findByClassId(classId));
        }
        return ResponseEntity.ok(classScheduleExceptionRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassScheduleException> getById(@PathVariable Long id) {
        return classScheduleExceptionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ClassScheduleException> create(@Valid @RequestBody ClassScheduleException classScheduleException) {
        return ResponseEntity.ok(classScheduleExceptionRepository.save(classScheduleException));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClassScheduleException> update(@PathVariable Long id, @Valid @RequestBody ClassScheduleException classScheduleException) {
        return classScheduleExceptionRepository.findById(id)
                .map(existing -> {
                    classScheduleException.setId(id);
                    return ResponseEntity.ok(classScheduleExceptionRepository.save(classScheduleException));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (classScheduleExceptionRepository.existsById(id)) {
            classScheduleExceptionRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
