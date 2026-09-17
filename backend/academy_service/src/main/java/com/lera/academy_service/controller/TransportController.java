package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.TransportRoute;
import com.lera.academy_service.entity.Vehicle;
import com.lera.academy_service.entity.TransportDriver;
import com.lera.academy_service.entity.StudentTransport;
import com.lera.academy_service.entity.TransportSchedule;
import com.lera.academy_service.repository.TransportRouteRepository;
import com.lera.academy_service.repository.TransportScheduleRepository;
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
    private final TransportScheduleRepository transportScheduleRepository;
    private final AcademyAuthorizationService authz;

    /**
     * A TransportRoute row holds only the route itself; the times live on TransportSchedule, the
     * driver and vehicle on the entities that schedule points at, and the seats taken are a count
     * of StudentTransport. The routes page needs all of it, and previously read `name`,
     * `departureTime`, `driver`, `vehicle`, `capacity` and `enrolled` straight off the route —
     * none of which are fields on it, so every card rendered blank and the seats bar computed
     * undefined/undefined = NaN. Resolve them here, in batched queries, as
     * ClassController#withDisplayNames does.
     */
    private List<Map<String, Object>> toRoutes(List<TransportRoute> routes) {
        if (routes.isEmpty()) return List.of();

        Set<UUID> routeIds = new HashSet<>();
        for (TransportRoute r : routes) {
            UUID id = parseUuid(r.getId());
            if (id != null) routeIds.add(id);
        }

        // One schedule per route is the common case; if a route has several, the earliest start wins.
        Map<UUID, TransportSchedule> scheduleByRoute = new HashMap<>();
        if (!routeIds.isEmpty()) {
            for (TransportSchedule sch : transportScheduleRepository.findAll()) {
                if (sch.getRouteId() == null || !routeIds.contains(sch.getRouteId())) continue;
                if (Boolean.FALSE.equals(sch.getIsActive())) continue;
                TransportSchedule existing = scheduleByRoute.get(sch.getRouteId());
                if (existing == null
                        || (sch.getStartTime() != null && existing.getStartTime() != null
                            && sch.getStartTime().isBefore(existing.getStartTime()))) {
                    scheduleByRoute.put(sch.getRouteId(), sch);
                }
            }
        }

        Set<UUID> vehicleIds = new HashSet<>();
        Set<UUID> driverIds = new HashSet<>();
        for (TransportSchedule sch : scheduleByRoute.values()) {
            if (sch.getVehicleId() != null) vehicleIds.add(sch.getVehicleId());
            if (sch.getDriverId() != null) driverIds.add(sch.getDriverId());
        }
        Map<UUID, Vehicle> vehicles = new HashMap<>();
        if (!vehicleIds.isEmpty()) {
            for (Vehicle v : vehicleRepository.findAllById(vehicleIds)) vehicles.put(v.getId(), v);
        }
        Map<UUID, TransportDriver> drivers = new HashMap<>();
        if (!driverIds.isEmpty()) {
            for (TransportDriver d : transportDriverRepository.findAllById(driverIds)) drivers.put(d.getId(), d);
        }

        // Seats taken per route: only registrations that are actually running count.
        Map<UUID, Integer> enrolled = new HashMap<>();
        for (StudentTransport st : studentTransportRepository.findAll()) {
            if (st.getRouteId() == null || !routeIds.contains(st.getRouteId())) continue;
            if (st.getStatus() != null && !"ACTIVE".equalsIgnoreCase(st.getStatus())) continue;
            enrolled.merge(st.getRouteId(), 1, Integer::sum);
        }

        List<Map<String, Object>> out = new ArrayList<>();
        for (TransportRoute r : routes) {
            UUID id = parseUuid(r.getId());
            TransportSchedule sch = id == null ? null : scheduleByRoute.get(id);
            Vehicle vehicle = sch == null || sch.getVehicleId() == null ? null : vehicles.get(sch.getVehicleId());
            TransportDriver driver = sch == null || sch.getDriverId() == null ? null : drivers.get(sch.getDriverId());

            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("routeCode", r.getRouteCode());
            m.put("name", r.getRouteName());
            m.put("nameVi", r.getRouteNameVi());
            m.put("routeType", r.getRouteType());
            m.put("description", r.getDescription());
            m.put("startPoint", r.getStartLocation());
            m.put("endPoint", r.getEndLocation());
            m.put("totalDistance", r.getTotalDistance());
            m.put("estimatedDuration", r.getEstimatedDuration());
            m.put("departureTime", sch == null ? null : sch.getStartTime());
            m.put("arrivalTime", sch == null ? null : sch.getEndTime());
            m.put("daysOfWeek", sch == null ? null : sch.getDaysOfWeek());
            m.put("driver", driver == null ? null : driver.getFullname());
            m.put("driverPhone", driver == null ? null : driver.getPhone());
            m.put("vehicle", vehicle == null ? null : vehicle.getVehicleNumber());
            m.put("capacity", vehicle == null ? null : vehicle.getCapacity());
            m.put("enrolled", id == null ? 0 : enrolled.getOrDefault(id, 0));
            m.put("status", Boolean.FALSE.equals(r.getIsActive()) ? "inactive" : "active");
            out.add(m);
        }
        return out;
    }

    private static UUID parseUuid(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    @GetMapping("/routes")
    public ResponseEntity<List<Map<String, Object>>> getAllRoutes(Pageable pageable) {
        authz.assertStaff();
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Org-wide role required for unfiltered transport route list");
        }
        return ResponseEntity.ok(toRoutes(transportRouteRepository.findAll(pageable).getContent()));
    }
    
    @GetMapping("/routes/{id}")
    public ResponseEntity<Map<String, Object>> getRouteById(@PathVariable String id) {
        return transportRouteRepository.findById(id)
                .map(r -> ResponseEntity.ok(toRoutes(List.of(r)).get(0)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/routes/code/{routeCode}")
    public ResponseEntity<TransportRoute> getRouteByCode(@PathVariable String routeCode) {
        return transportRouteRepository.findByRouteCode(routeCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/routes/active")
    public ResponseEntity<List<Map<String, Object>>> getActiveRoutes() {
        return ResponseEntity.ok(toRoutes(transportRouteRepository.findByIsActive(true)));
    }
    
    @GetMapping("/routes/type/{routeType}")
    public ResponseEntity<List<Map<String, Object>>> getRoutesByType(@PathVariable String routeType) {
        return ResponseEntity.ok(toRoutes(transportRouteRepository.findByRouteType(routeType)));
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

    /**
     * student_id, stop_id, transport_type, status and start_date are all NOT NULL. A body missing
     * any of them used to reach the insert and come back as an opaque 500, which the routes page
     * swallowed into console.error — so the Register button appeared to do nothing at all. Reject
     * an incomplete registration with a 400 that names the missing field instead.
     */
    @PostMapping("/register")
    public ResponseEntity<StudentTransport> registerForTransport(@Valid @RequestBody StudentTransport registration) {
        requireField(registration.getStudentId(), "studentId");
        requireField(registration.getRouteId(), "routeId");
        requireField(registration.getStopId(), "stopId");
        requireField(registration.getTransportType(), "transportType");
        if (registration.getStartDate() == null) registration.setStartDate(LocalDateTime.now());
        if (registration.getStatus() == null || registration.getStatus().isBlank()) {
            registration.setStatus("PENDING");
        }
        return ResponseEntity.ok(studentTransportRepository.save(registration));
    }

    private static void requireField(Object value, String name) {
        if (value == null || (value instanceof String str && str.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Transport registration requires " + name);
        }
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
