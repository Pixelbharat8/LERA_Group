package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.TransportRoute;
import com.lera.academy_service.entity.Vehicle;
import com.lera.academy_service.entity.TransportDriver;
import com.lera.academy_service.entity.StudentTransport;
import com.lera.academy_service.repository.TransportRouteRepository;
import com.lera.academy_service.repository.VehicleRepository;
import com.lera.academy_service.repository.TransportDriverRepository;
import com.lera.academy_service.repository.StudentTransportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/transport")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class TransportController {
    
    private final TransportRouteRepository transportRouteRepository;
    private final VehicleRepository vehicleRepository;
    private final TransportDriverRepository transportDriverRepository;
    private final StudentTransportRepository studentTransportRepository;
    private final AcademyAuthorizationService authz;

    @GetMapping("/routes")
    public ResponseEntity<List<TransportRoute>> getAllRoutes(Pageable pageable) {
        authz.assertStaff();
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Org-wide role required for unfiltered transport route list");
        }
        return ResponseEntity.ok(transportRouteRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/routes/{id}")
    public ResponseEntity<TransportRoute> getRouteById(@PathVariable String id) {
        return transportRouteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/routes/code/{routeCode}")
    public ResponseEntity<TransportRoute> getRouteByCode(@PathVariable String routeCode) {
        return transportRouteRepository.findByRouteCode(routeCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/routes/active")
    public ResponseEntity<List<TransportRoute>> getActiveRoutes() {
        return ResponseEntity.ok(transportRouteRepository.findByIsActive(true));
    }
    
    @GetMapping("/routes/type/{routeType}")
    public ResponseEntity<List<TransportRoute>> getRoutesByType(@PathVariable String routeType) {
        return ResponseEntity.ok(transportRouteRepository.findByRouteType(routeType));
    }
    
    @PostMapping("/routes")
    public ResponseEntity<TransportRoute> createRoute(@Valid @RequestBody TransportRoute route) {
        return ResponseEntity.ok(transportRouteRepository.save(route));
    }
    
    @PutMapping("/routes/{id}")
    public ResponseEntity<TransportRoute> updateRoute(@PathVariable String id, @Valid @RequestBody TransportRoute routeDetails) {
        return transportRouteRepository.findById(id).map(route -> {
            if (routeDetails.getRouteName() != null) route.setRouteName(routeDetails.getRouteName());
            if (routeDetails.getRouteNameVi() != null) route.setRouteNameVi(routeDetails.getRouteNameVi());
            if (routeDetails.getRouteType() != null) route.setRouteType(routeDetails.getRouteType());
            if (routeDetails.getDescription() != null) route.setDescription(routeDetails.getDescription());
            if (routeDetails.getStartLocation() != null) route.setStartLocation(routeDetails.getStartLocation());
            if (routeDetails.getEndLocation() != null) route.setEndLocation(routeDetails.getEndLocation());
            if (routeDetails.getTotalDistance() != null) route.setTotalDistance(routeDetails.getTotalDistance());
            if (routeDetails.getEstimatedDuration() != null) route.setEstimatedDuration(routeDetails.getEstimatedDuration());
            if (routeDetails.getIsActive() != null) route.setIsActive(routeDetails.getIsActive());
            return ResponseEntity.ok(transportRouteRepository.save(route));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/routes/{id}")
    public ResponseEntity<Void> deleteRoute(@PathVariable String id) {
        if (transportRouteRepository.existsById(id)) {
            transportRouteRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ============== VEHICLES ==============
    
    // ============== VEHICLES (real, backed by VehicleRepository) ==============

    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getVehicles() {
        return ResponseEntity.ok(vehicleRepository.findAll());
    }

    @GetMapping("/vehicles/{id}")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable UUID id) {
        return vehicleRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/vehicles")
    public ResponseEntity<Vehicle> createVehicle(@Valid @RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(vehicleRepository.save(vehicle));
    }

    @PutMapping("/vehicles/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable UUID id, @Valid @RequestBody Vehicle vehicle) {
        if (!vehicleRepository.existsById(id)) return ResponseEntity.notFound().build();
        vehicle.setId(id);
        return ResponseEntity.ok(vehicleRepository.save(vehicle));
    }

    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable UUID id) {
        if (!vehicleRepository.existsById(id)) return ResponseEntity.notFound().build();
        vehicleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ============== DRIVERS (real, backed by TransportDriverRepository) ==============

    @GetMapping("/drivers")
    public ResponseEntity<List<TransportDriver>> getDrivers() {
        return ResponseEntity.ok(transportDriverRepository.findAll());
    }

    @GetMapping("/drivers/{id}")
    public ResponseEntity<TransportDriver> getDriverById(@PathVariable UUID id) {
        return transportDriverRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/drivers")
    public ResponseEntity<TransportDriver> createDriver(@Valid @RequestBody TransportDriver driver) {
        return ResponseEntity.ok(transportDriverRepository.save(driver));
    }

    @PutMapping("/drivers/{id}")
    public ResponseEntity<TransportDriver> updateDriver(@PathVariable UUID id, @Valid @RequestBody TransportDriver driver) {
        if (!transportDriverRepository.existsById(id)) return ResponseEntity.notFound().build();
        driver.setId(id);
        return ResponseEntity.ok(transportDriverRepository.save(driver));
    }

    @DeleteMapping("/drivers/{id}")
    public ResponseEntity<Void> deleteDriver(@PathVariable UUID id) {
        if (!transportDriverRepository.existsById(id)) return ResponseEntity.notFound().build();
        transportDriverRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ============== STUDENT TRANSPORT REGISTRATIONS (real, backed by StudentTransportRepository) ==============

    @GetMapping("/registrations")
    public ResponseEntity<List<StudentTransport>> getAllRegistrations(
            @RequestParam(required = false) String routeId,
            @RequestParam(required = false) String status) {
        List<StudentTransport> all = studentTransportRepository.findAll();
        if (status != null && !status.isBlank()) {
            all = all.stream().filter(r -> status.equalsIgnoreCase(r.getStatus())).toList();
        }
        if (routeId != null && !routeId.isBlank()) {
            all = all.stream()
                    .filter(r -> r.getRouteId() != null && routeId.equals(r.getRouteId().toString()))
                    .toList();
        }
        return ResponseEntity.ok(all);
    }

    @PostMapping("/register")
    public ResponseEntity<StudentTransport> registerForTransport(@Valid @RequestBody StudentTransport registration) {
        return ResponseEntity.ok(studentTransportRepository.save(registration));
    }

    @PutMapping("/registrations/{id}/approve")
    public ResponseEntity<StudentTransport> approveRegistration(@PathVariable UUID id) {
        return studentTransportRepository.findById(id).map(reg -> {
            reg.setStatus("ACTIVE");
            return ResponseEntity.ok(studentTransportRepository.save(reg));
        }).orElse(ResponseEntity.notFound().build());
    }

    // The caller's own registration is resolved via Academy's user→student link, which isn't wired
    // in this controller; return an honest empty result rather than fabricating a registration.
    @GetMapping("/my-registration")
    public ResponseEntity<StudentTransport> getMyRegistration(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.noContent().build();
    }
}
