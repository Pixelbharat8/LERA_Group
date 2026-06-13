package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.TransportRoute;
import com.lera.academy_service.repository.TransportRouteRepository;
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
    
    @GetMapping("/vehicles")
    public ResponseEntity<List<Map<String, Object>>> getVehicles() {
        List<Map<String, Object>> vehicles = new ArrayList<>();
        
        for (int i = 1; i <= 10; i++) {
            Map<String, Object> vehicle = new HashMap<>();
            vehicle.put("id", UUID.randomUUID().toString());
            vehicle.put("vehicleNumber", "51A-" + String.format("%05d", 10000 + i));
            vehicle.put("type", i % 3 == 0 ? "Bus" : i % 3 == 1 ? "Van" : "Mini Bus");
            vehicle.put("capacity", 20 + (i % 4) * 10);
            vehicle.put("make", i % 2 == 0 ? "Toyota" : "Ford");
            vehicle.put("model", "Transit 2023");
            vehicle.put("status", i % 4 == 0 ? "MAINTENANCE" : "ACTIVE");
            vehicle.put("routeId", "route-" + (i % 5 + 1));
            vehicle.put("routeName", "Route " + (i % 5 + 1));
            vehicle.put("driverId", "driver-" + i);
            vehicle.put("driverName", "Driver " + i);
            vehicle.put("lastService", LocalDate.now().minusMonths(i % 3));
            vehicle.put("nextServiceDue", LocalDate.now().plusMonths(3 - (i % 3)));
            vehicle.put("gpsEnabled", true);
            vehicles.add(vehicle);
        }
        
        return ResponseEntity.ok(vehicles);
    }

    @GetMapping("/vehicles/{id}")
    public ResponseEntity<Map<String, Object>> getVehicleById(@PathVariable String id) {
        Map<String, Object> vehicle = new HashMap<>();
        vehicle.put("id", id);
        vehicle.put("vehicleNumber", "51A-10001");
        vehicle.put("type", "Bus");
        vehicle.put("capacity", 40);
        vehicle.put("make", "Toyota");
        vehicle.put("model", "Coaster 2023");
        vehicle.put("status", "ACTIVE");
        vehicle.put("routeId", "route-1");
        vehicle.put("routeName", "Route 1 - City Center");
        vehicle.put("driverId", "driver-1");
        vehicle.put("driverName", "John Smith");
        vehicle.put("lastService", LocalDate.now().minusMonths(1));
        vehicle.put("nextServiceDue", LocalDate.now().plusMonths(2));
        vehicle.put("gpsEnabled", true);
        vehicle.put("insuranceExpiry", LocalDate.now().plusMonths(8));
        vehicle.put("registrationExpiry", LocalDate.now().plusYears(1));
        
        return ResponseEntity.ok(vehicle);
    }

    @PostMapping("/vehicles")
    public ResponseEntity<Map<String, Object>> createVehicle(@Valid @RequestBody Map<String, Object> request) {
        Map<String, Object> vehicle = new HashMap<>(request);
        vehicle.put("id", UUID.randomUUID().toString());
        vehicle.put("createdAt", LocalDateTime.now());
        
        return ResponseEntity.ok(vehicle);
    }

    @PutMapping("/vehicles/{id}")
    public ResponseEntity<Map<String, Object>> updateVehicle(@PathVariable String id, @Valid @RequestBody Map<String, Object> request) {
        Map<String, Object> vehicle = new HashMap<>(request);
        vehicle.put("id", id);
        vehicle.put("updatedAt", LocalDateTime.now());
        
        return ResponseEntity.ok(vehicle);
    }

    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable String id) {
        return ResponseEntity.noContent().build();
    }

    // ============== DRIVERS ==============
    
    @GetMapping("/drivers")
    public ResponseEntity<List<Map<String, Object>>> getDrivers() {
        List<Map<String, Object>> drivers = new ArrayList<>();
        
        for (int i = 1; i <= 8; i++) {
            Map<String, Object> driver = new HashMap<>();
            driver.put("id", UUID.randomUUID().toString());
            driver.put("name", "Driver " + i);
            driver.put("phone", "+84 90" + String.format("%07d", 1000000 + i));
            driver.put("email", "driver" + i + "@lera.edu");
            driver.put("licenseNumber", "B2-" + String.format("%08d", 10000000 + i));
            driver.put("licenseExpiry", LocalDate.now().plusYears(i % 3 + 1));
            driver.put("vehicleId", "vehicle-" + i);
            driver.put("vehicleNumber", "51A-" + String.format("%05d", 10000 + i));
            driver.put("routeId", "route-" + (i % 5 + 1));
            driver.put("routeName", "Route " + (i % 5 + 1));
            driver.put("status", i % 5 == 0 ? "ON_LEAVE" : "ACTIVE");
            driver.put("experience", i + 2 + " years");
            driver.put("rating", 4.0 + (i % 10) * 0.1);
            drivers.add(driver);
        }
        
        return ResponseEntity.ok(drivers);
    }

    @GetMapping("/drivers/{id}")
    public ResponseEntity<Map<String, Object>> getDriverById(@PathVariable String id) {
        Map<String, Object> driver = new HashMap<>();
        driver.put("id", id);
        driver.put("name", "John Smith");
        driver.put("phone", "+84 901234567");
        driver.put("email", "john.smith@lera.edu");
        driver.put("licenseNumber", "B2-10000001");
        driver.put("licenseExpiry", LocalDate.now().plusYears(2));
        driver.put("vehicleId", "vehicle-1");
        driver.put("vehicleNumber", "51A-10001");
        driver.put("routeId", "route-1");
        driver.put("routeName", "Route 1 - City Center");
        driver.put("status", "ACTIVE");
        driver.put("experience", "5 years");
        driver.put("rating", 4.8);
        driver.put("address", "123 Main Street");
        driver.put("emergencyContact", "+84 909876543");
        driver.put("joinDate", LocalDate.now().minusYears(3));
        
        return ResponseEntity.ok(driver);
    }

    @PostMapping("/drivers")
    public ResponseEntity<Map<String, Object>> createDriver(@Valid @RequestBody Map<String, Object> request) {
        Map<String, Object> driver = new HashMap<>(request);
        driver.put("id", UUID.randomUUID().toString());
        driver.put("createdAt", LocalDateTime.now());
        
        return ResponseEntity.ok(driver);
    }

    @PutMapping("/drivers/{id}")
    public ResponseEntity<Map<String, Object>> updateDriver(@PathVariable String id, @Valid @RequestBody Map<String, Object> request) {
        Map<String, Object> driver = new HashMap<>(request);
        driver.put("id", id);
        driver.put("updatedAt", LocalDateTime.now());
        
        return ResponseEntity.ok(driver);
    }

    @DeleteMapping("/drivers/{id}")
    public ResponseEntity<Void> deleteDriver(@PathVariable String id) {
        return ResponseEntity.noContent().build();
    }

    // ============== MY REGISTRATION ==============
    
    @GetMapping("/my-registration")
    public ResponseEntity<Map<String, Object>> getMyRegistration(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        
        Map<String, Object> registration = new HashMap<>();
        registration.put("id", UUID.randomUUID().toString());
        registration.put("userId", userId != null ? userId : "user-1");
        registration.put("studentName", "John Doe");
        registration.put("studentId", "STU2024001");
        registration.put("routeId", "route-1");
        registration.put("routeName", "Route 1 - City Center");
        registration.put("vehicleId", "vehicle-1");
        registration.put("vehicleNumber", "51A-10001");
        registration.put("driverId", "driver-1");
        registration.put("driverName", "James Driver");
        registration.put("driverPhone", "+84 901234567");
        registration.put("pickupPoint", "Bus Stop A - Near School Gate");
        registration.put("pickupTime", "07:30");
        registration.put("dropoffPoint", "Home - District 1");
        registration.put("dropoffTime", "17:00");
        registration.put("monthlyFee", 150);
        registration.put("status", "ACTIVE");
        registration.put("startDate", LocalDate.now().minusMonths(2));
        registration.put("endDate", LocalDate.now().plusMonths(10));
        
        return ResponseEntity.ok(registration);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerForTransport(@Valid @RequestBody Map<String, Object> request) {
        Map<String, Object> registration = new HashMap<>(request);
        registration.put("id", UUID.randomUUID().toString());
        registration.put("status", "PENDING");
        registration.put("createdAt", LocalDateTime.now());
        
        return ResponseEntity.ok(registration);
    }

    @GetMapping("/registrations")
    public ResponseEntity<List<Map<String, Object>>> getAllRegistrations(
            @RequestParam(required = false) String routeId,
            @RequestParam(required = false) String status) {
        
        List<Map<String, Object>> registrations = new ArrayList<>();
        
        for (int i = 1; i <= 15; i++) {
            Map<String, Object> reg = new HashMap<>();
            reg.put("id", UUID.randomUUID().toString());
            reg.put("userId", "user-" + i);
            reg.put("studentName", "Student " + i);
            reg.put("studentId", "STU2024" + String.format("%03d", i));
            reg.put("routeId", "route-" + (i % 5 + 1));
            reg.put("routeName", "Route " + (i % 5 + 1));
            reg.put("pickupPoint", "Stop " + (char)('A' + (i % 5)));
            reg.put("pickupTime", "07:" + String.format("%02d", 20 + (i % 4) * 10));
            reg.put("status", i % 4 == 0 ? "PENDING" : "ACTIVE");
            reg.put("monthlyFee", 150);
            registrations.add(reg);
        }
        
        return ResponseEntity.ok(registrations);
    }

    @PutMapping("/registrations/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveRegistration(@PathVariable String id) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", id);
        result.put("status", "ACTIVE");
        result.put("approvedAt", LocalDateTime.now());
        result.put("message", "Transport registration approved successfully");
        
        return ResponseEntity.ok(result);
    }
}
