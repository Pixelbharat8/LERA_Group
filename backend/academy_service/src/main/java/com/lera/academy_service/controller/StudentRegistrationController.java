package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.StudentRegistration;
import com.lera.academy_service.repository.StudentRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/student-registrations")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class StudentRegistrationController {
    
    private final StudentRegistrationRepository registrationRepository;
    
    @GetMapping
    public ResponseEntity<List<StudentRegistration>> getAllRegistrations() {
        return ResponseEntity.ok(registrationRepository.findAllByOrderByCreatedAtDesc());
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", registrationRepository.count());
        stats.put("confirmed", registrationRepository.countByStatus("CONFIRMED"));
        stats.put("pending", registrationRepository.countByStatus("PENDING"));
        stats.put("paid", registrationRepository.countByPaymentStatus("PAID"));
        stats.put("partialPaid", registrationRepository.countByPaymentStatus("PARTIAL"));
        stats.put("unpaid", registrationRepository.countByPaymentStatus("PENDING"));
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<StudentRegistration> getById(@PathVariable UUID id) {
        return registrationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<StudentRegistration>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(registrationRepository.findByStatus(status.toUpperCase()));
    }
    
    @GetMapping("/payment-status/{status}")
    public ResponseEntity<List<StudentRegistration>> getByPaymentStatus(@PathVariable String status) {
        return ResponseEntity.ok(registrationRepository.findByPaymentStatus(status.toUpperCase()));
    }
    
    @PostMapping
    public ResponseEntity<StudentRegistration> create(@Valid @RequestBody StudentRegistration registration) {
        return ResponseEntity.ok(registrationRepository.save(registration));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<StudentRegistration> update(@PathVariable UUID id, @Valid @RequestBody StudentRegistration details) {
        return registrationRepository.findById(id).map(reg -> {
            if (details.getStudentName() != null) reg.setStudentName(details.getStudentName());
            if (details.getParentName() != null) reg.setParentName(details.getParentName());
            if (details.getParentPhone() != null) reg.setParentPhone(details.getParentPhone());
            if (details.getParentEmail() != null) reg.setParentEmail(details.getParentEmail());
            if (details.getCourseId() != null) reg.setCourseId(details.getCourseId());
            if (details.getCourseName() != null) reg.setCourseName(details.getCourseName());
            if (details.getStatus() != null) reg.setStatus(details.getStatus());
            if (details.getPaymentStatus() != null) reg.setPaymentStatus(details.getPaymentStatus());
            if (details.getAmount() != null) reg.setAmount(details.getAmount());
            if (details.getNotes() != null) reg.setNotes(details.getNotes());
            return ResponseEntity.ok(registrationRepository.save(reg));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/confirm")
    public ResponseEntity<StudentRegistration> confirm(@PathVariable UUID id) {
        return registrationRepository.findById(id).map(reg -> {
            reg.setStatus("CONFIRMED");
            return ResponseEntity.ok(registrationRepository.save(reg));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (registrationRepository.existsById(id)) {
            registrationRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
