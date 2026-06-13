package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.TransportAttendance;
import com.lera.academy_service.repository.TransportAttendanceRepository;
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
@RequestMapping("/api/transport-attendance")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class TransportAttendanceController {

    private final TransportAttendanceRepository transportAttendanceRepository;

    @GetMapping
    public ResponseEntity<List<TransportAttendance>> getAll(Pageable pageable) {
        return ResponseEntity.ok(transportAttendanceRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransportAttendance> getById(@PathVariable UUID id) {
        return transportAttendanceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TransportAttendance> create(@Valid @RequestBody TransportAttendance transportAttendance) {
        return ResponseEntity.ok(transportAttendanceRepository.save(transportAttendance));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransportAttendance> update(@PathVariable UUID id, @Valid @RequestBody TransportAttendance transportAttendance) {
        return transportAttendanceRepository.findById(id)
                .map(existing -> {
                    transportAttendance.setId(id);
                    return ResponseEntity.ok(transportAttendanceRepository.save(transportAttendance));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (transportAttendanceRepository.existsById(id)) {
            transportAttendanceRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
