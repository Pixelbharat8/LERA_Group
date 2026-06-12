package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.FacilityBooking;
import com.lera.academy_service.repository.FacilityBookingRepository;
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
@RequestMapping("/api/facility-bookings")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class FacilityBookingController {

    private final FacilityBookingRepository facilityBookingRepository;

    @GetMapping
    public ResponseEntity<List<FacilityBooking>> getAll(Pageable pageable) {
        return ResponseEntity.ok(facilityBookingRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacilityBooking> getById(@PathVariable UUID id) {
        return facilityBookingRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<FacilityBooking> create(@Valid @RequestBody FacilityBooking facilityBooking) {
        return ResponseEntity.ok(facilityBookingRepository.save(facilityBooking));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacilityBooking> update(@PathVariable UUID id, @Valid @RequestBody FacilityBooking facilityBooking) {
        return facilityBookingRepository.findById(id)
                .map(existing -> {
                    facilityBooking.setId(id);
                    return ResponseEntity.ok(facilityBookingRepository.save(facilityBooking));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (facilityBookingRepository.existsById(id)) {
            facilityBookingRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
