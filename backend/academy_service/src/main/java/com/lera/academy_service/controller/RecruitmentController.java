package com.lera.academy_service.controller;

import com.lera.academy_service.entity.JobApplication;
import com.lera.academy_service.entity.JobOpening;
import com.lera.academy_service.repository.JobApplicationRepository;
import com.lera.academy_service.repository.JobOpeningRepository;
import com.lera.academy_service.security.AcademyRoles;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Internal recruitment / ATS: job openings + an application pipeline. DB-backed.
 */
@RestController
@RequestMapping("/api/job-openings")
@PreAuthorize(AcademyRoles.STAFF)
public class RecruitmentController {

    private static final String HR_ROLES =
            "hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')";

    private final JobOpeningRepository openings;
    private final JobApplicationRepository applications;

    public RecruitmentController(JobOpeningRepository openings, JobApplicationRepository applications) {
        this.openings = openings;
        this.applications = applications;
    }

    // ---- openings ----

    @GetMapping
    public ResponseEntity<List<JobOpening>> list(@RequestParam(required = false) String status,
                                                 @RequestParam(required = false) UUID centerId) {
        List<JobOpening> result;
        if (centerId != null) result = openings.findByCenterIdOrderByPostedDateDesc(centerId);
        else if (status != null && !status.isBlank()) result = openings.findByStatusOrderByPostedDateDesc(status);
        else result = openings.findAllByOrderByPostedDateDesc();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/open")
    public ResponseEntity<List<JobOpening>> open() {
        return ResponseEntity.ok(openings.findByStatusOrderByPostedDateDesc("OPEN"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobOpening> getById(@PathVariable UUID id) {
        return openings.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize(HR_ROLES)
    public ResponseEntity<JobOpening> create(@Valid @RequestBody JobOpening body) {
        body.setId(null);
        return ResponseEntity.ok(openings.save(body));
    }

    @PutMapping("/{id}")
    @PreAuthorize(HR_ROLES)
    public ResponseEntity<JobOpening> update(@PathVariable UUID id, @Valid @RequestBody JobOpening body) {
        return openings.findById(id).map(o -> {
            o.setTitle(body.getTitle());
            o.setDepartment(body.getDepartment());
            o.setCenterId(body.getCenterId());
            o.setLocation(body.getLocation());
            o.setEmploymentType(body.getEmploymentType());
            o.setDescription(body.getDescription());
            o.setRequirements(body.getRequirements());
            o.setOpeningsCount(body.getOpeningsCount());
            o.setClosingDate(body.getClosingDate());
            if (body.getStatus() != null) o.setStatus(body.getStatus());
            return ResponseEntity.ok(openings.save(o));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/close")
    @PreAuthorize(HR_ROLES)
    public ResponseEntity<JobOpening> close(@PathVariable UUID id) {
        return setStatus(id, "CLOSED");
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize(HR_ROLES)
    public ResponseEntity<JobOpening> reopen(@PathVariable UUID id) {
        return setStatus(id, "OPEN");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(HR_ROLES)
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!openings.existsById(id)) return ResponseEntity.notFound().build();
        openings.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---- applications (ATS pipeline) ----

    @PostMapping("/{id}/apply")
    public ResponseEntity<JobApplication> apply(@PathVariable UUID id, @Valid @RequestBody JobApplication body) {
        if (!openings.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Job opening not found");
        }
        body.setId(null);
        body.setJobOpeningId(id);
        body.setStatus("APPLIED");
        return ResponseEntity.ok(applications.save(body));
    }

    @GetMapping("/{id}/applications")
    @PreAuthorize(HR_ROLES)
    public ResponseEntity<List<JobApplication>> applicationsForJob(@PathVariable UUID id) {
        return ResponseEntity.ok(applications.findByJobOpeningIdOrderByAppliedAtDesc(id));
    }

    @PostMapping("/applications/{appId}/status")
    @PreAuthorize(HR_ROLES)
    public ResponseEntity<JobApplication> moveStatus(@PathVariable UUID appId,
                                                     @RequestBody Map<String, Object> body) {
        Object status = body.get("status");
        if (status == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        return applications.findById(appId).map(a -> {
            a.setStatus(status.toString());
            if (body.get("notes") != null) a.setNotes(body.get("notes").toString());
            return ResponseEntity.ok(applications.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/applications/{appId}")
    @PreAuthorize(HR_ROLES)
    public ResponseEntity<Void> deleteApplication(@PathVariable UUID appId) {
        if (!applications.existsById(appId)) return ResponseEntity.notFound().build();
        applications.deleteById(appId);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<JobOpening> setStatus(UUID id, String status) {
        return openings.findById(id).map(o -> {
            o.setStatus(status);
            return ResponseEntity.ok(openings.save(o));
        }).orElse(ResponseEntity.notFound().build());
    }
}
