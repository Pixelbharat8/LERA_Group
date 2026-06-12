package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.TransportSchedule;
import com.lera.academy_service.repository.TransportScheduleRepository;
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
@RequestMapping("/api/transport-schedules")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class TransportScheduleController {

    private final TransportScheduleRepository transportScheduleRepository;

    @GetMapping
    public ResponseEntity<List<TransportSchedule>> getAll(Pageable pageable) {
        return ResponseEntity.ok(transportScheduleRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransportSchedule> getById(@PathVariable UUID id) {
        return transportScheduleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TransportSchedule> create(@Valid @RequestBody TransportSchedule transportSchedule) {
        return ResponseEntity.ok(transportScheduleRepository.save(transportSchedule));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransportSchedule> update(@PathVariable UUID id, @Valid @RequestBody TransportSchedule transportSchedule) {
        return transportScheduleRepository.findById(id)
                .map(existing -> {
                    transportSchedule.setId(id);
                    return ResponseEntity.ok(transportScheduleRepository.save(transportSchedule));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (transportScheduleRepository.existsById(id)) {
            transportScheduleRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
