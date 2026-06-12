package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.TrainingAttendance;
import com.lera.academy_service.repository.TrainingAttendanceRepository;
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
@RequestMapping("/api/training-attendance")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class TrainingAttendanceController {

    private final TrainingAttendanceRepository trainingAttendanceRepository;

    @GetMapping
    public ResponseEntity<List<TrainingAttendance>> getAll(Pageable pageable) {
        return ResponseEntity.ok(trainingAttendanceRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrainingAttendance> getById(@PathVariable UUID id) {
        return trainingAttendanceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TrainingAttendance> create(@Valid @RequestBody TrainingAttendance trainingAttendance) {
        return ResponseEntity.ok(trainingAttendanceRepository.save(trainingAttendance));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrainingAttendance> update(@PathVariable UUID id, @Valid @RequestBody TrainingAttendance trainingAttendance) {
        return trainingAttendanceRepository.findById(id)
                .map(existing -> {
                    trainingAttendance.setId(id);
                    return ResponseEntity.ok(trainingAttendanceRepository.save(trainingAttendance));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (trainingAttendanceRepository.existsById(id)) {
            trainingAttendanceRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
