package com.lera.academy_service.controller;

import com.lera.academy_service.entity.HostelRegistration;
import com.lera.academy_service.entity.HostelRoom;
import com.lera.academy_service.repository.HostelRegistrationRepository;
import com.lera.academy_service.repository.HostelRoomRepository;
import com.lera.academy_service.security.AcademyRoles;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Hostel rooms + student registrations — now DB-backed (was an in-memory stub).
 * Core flows persist; the rarely-used complaints/fees endpoints return empty sets for now.
 */
@RestController
@RequestMapping("/api/hostel")
@PreAuthorize(AcademyRoles.STAFF)
public class HostelController {

    private static final String ADMIN = "hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')";

    private final HostelRoomRepository rooms;
    private final HostelRegistrationRepository registrations;
    private final com.lera.academy_service.security.AcademyAuthorizationService authz;

    public HostelController(HostelRoomRepository rooms, HostelRegistrationRepository registrations,
                            com.lera.academy_service.security.AcademyAuthorizationService authz) {
        this.rooms = rooms;
        this.registrations = registrations;
        this.authz = authz;
    }

    private Map<String, Object> roomDto(HostelRoom r) {
        int cap = r.getCapacity() != null ? r.getCapacity() : 0;
        int occ = r.getOccupancy() != null ? r.getOccupancy() : 0;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("roomNumber", r.getRoomNumber());
        m.put("block", r.getBlock());
        m.put("floor", r.getFloor());
        m.put("type", r.getType());
        m.put("capacity", cap);
        m.put("occupancy", occ);
        m.put("occupied", occ);
        m.put("available", Math.max(0, cap - occ));
        m.put("monthlyRent", r.getMonthlyRent());
        m.put("status", r.getStatus());
        m.put("description", r.getDescription());
        return m;
    }

    // ---- rooms ----

    @GetMapping("/rooms")
    public ResponseEntity<List<Map<String, Object>>> getRooms(@RequestParam(required = false) UUID centerId) {
        UUID eff = authz.effectiveListCenterId(centerId);
        List<HostelRoom> list = eff != null
                ? rooms.findByCenterIdOrderByRoomNumberAsc(eff) : rooms.findAllByOrderByRoomNumberAsc();
        return ResponseEntity.ok(list.stream().map(this::roomDto).toList());
    }

    @GetMapping("/rooms/{id}")
    public ResponseEntity<Map<String, Object>> getRoom(@PathVariable UUID id) {
        return rooms.findById(id).map(r -> ResponseEntity.ok(roomDto(r))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/rooms")
    @PreAuthorize(ADMIN)
    public ResponseEntity<HostelRoom> createRoom(@Valid @RequestBody HostelRoom room) {
        room.setId(null);
        return ResponseEntity.ok(rooms.save(room));
    }

    @PutMapping("/rooms/{id}")
    @PreAuthorize(ADMIN)
    public ResponseEntity<HostelRoom> updateRoom(@PathVariable UUID id, @Valid @RequestBody HostelRoom body) {
        return rooms.findById(id).map(r -> {
            r.setRoomNumber(body.getRoomNumber());
            r.setBlock(body.getBlock());
            r.setFloor(body.getFloor());
            r.setType(body.getType());
            r.setCapacity(body.getCapacity());
            r.setMonthlyRent(body.getMonthlyRent());
            r.setDescription(body.getDescription());
            if (body.getStatus() != null) r.setStatus(body.getStatus());
            return ResponseEntity.ok(rooms.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/rooms/{id}")
    @PreAuthorize(ADMIN)
    public ResponseEntity<Void> deleteRoom(@PathVariable UUID id) {
        if (!rooms.existsById(id)) return ResponseEntity.notFound().build();
        rooms.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---- registrations ----

    @GetMapping("/my-registration")
    public ResponseEntity<HostelRegistration> myRegistration(@RequestParam(required = false) UUID studentId) {
        if (studentId == null) return ResponseEntity.ok(null);
        authz.assertCanViewStudent(studentId);   // only the student's own people / their centre's staff
        return registrations.findByStudentIdOrderByCreatedAtDesc(studentId).stream()
                .findFirst().map(ResponseEntity::ok).orElse(ResponseEntity.ok(null));
    }

    @PostMapping("/register")
    public ResponseEntity<HostelRegistration> register(@Valid @RequestBody HostelRegistration reg) {
        authz.assertCanViewStudent(reg.getStudentId());   // can't register a student you can't access
        reg.setId(null);
        reg.setStatus("PENDING");
        return ResponseEntity.ok(registrations.save(reg));
    }

    @GetMapping("/registrations")
    @PreAuthorize(ADMIN)
    public ResponseEntity<List<HostelRegistration>> allRegistrations(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(status != null && !status.isBlank()
                ? registrations.findByStatusOrderByCreatedAtDesc(status)
                : registrations.findAllByOrderByCreatedAtDesc());
    }

    @PutMapping("/registrations/{id}/approve")
    @PreAuthorize(ADMIN)
    public ResponseEntity<HostelRegistration> approve(@PathVariable UUID id) {
        return registrations.findById(id).map(reg -> {
            reg.setStatus("APPROVED");
            reg.setJoinDate(LocalDate.now());
            // bump room occupancy
            if (reg.getRoomId() != null) {
                rooms.findById(reg.getRoomId()).ifPresent(room -> {
                    int occ = (room.getOccupancy() != null ? room.getOccupancy() : 0) + 1;
                    room.setOccupancy(occ);
                    if (room.getCapacity() != null && occ >= room.getCapacity()) room.setStatus("FULL");
                    rooms.save(room);
                });
            }
            return ResponseEntity.ok(registrations.save(reg));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/registrations/{id}/reject")
    @PreAuthorize(ADMIN)
    public ResponseEntity<HostelRegistration> reject(@PathVariable UUID id,
                                                     @RequestBody(required = false) Map<String, Object> body) {
        return registrations.findById(id).map(reg -> {
            reg.setStatus("REJECTED");
            if (body != null && body.get("reason") != null) reg.setRejectionReason(body.get("reason").toString());
            return ResponseEntity.ok(registrations.save(reg));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---- stats ----

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> s = new LinkedHashMap<>();
        long total = rooms.count();
        s.put("totalRooms", total);
        s.put("availableRooms", rooms.countByStatus("AVAILABLE"));
        s.put("occupiedRooms", rooms.countByStatus("FULL"));
        s.put("maintenanceRooms", rooms.countByStatus("MAINTENANCE"));
        s.put("totalRegistrations", registrations.count());
        s.put("pendingRegistrations", registrations.countByStatus("PENDING"));
        return ResponseEntity.ok(s);
    }

    // ---- complaints & fees: not yet modelled; return empty so the UI degrades gracefully ----

    @GetMapping("/complaints")
    public ResponseEntity<List<Map<String, Object>>> complaints() { return ResponseEntity.ok(List.of()); }

    @GetMapping("/fees")
    public ResponseEntity<List<Map<String, Object>>> fees() { return ResponseEntity.ok(List.of()); }
}
