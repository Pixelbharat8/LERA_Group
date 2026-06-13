package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Referral;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.CurrentUser;
import com.lera.academy_service.service.ReferralService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Referrals API — used by the parent dashboard and admin CRM views.
 *
 * <p>Frontend call sites: {@code frontend/app/dashboard/academy/parents/[id]/page.tsx}
 * and (eventually) the admin CRM. Filtering by {@code parentId}, {@code studentId},
 * or {@code centerId} returns a scoped list; unfiltered and status-wide lists are
 * staff-only to avoid IDOR.
 */
@RestController
@RequestMapping("/api/referrals")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ReferralController {

    private final ReferralService referralService;
    private final StudentParentRepository studentParentRepository;
    private final StudentRepository studentRepository;
    private final AcademyAuthorizationService authz;

    @GetMapping
    public ResponseEntity<List<Referral>> listReferrals(
            @RequestParam(required = false) UUID parentId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) String status) {
        if (parentId != null) {
            if (!CurrentUser.isSelfOrStaff(parentId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            return ResponseEntity.ok(referralService.findForParent(parentId));
        }
        if (studentId != null) {
            if (!canAccessStudentReferrals(studentId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            return ResponseEntity.ok(referralService.findForStudent(studentId));
        }
        if (centerId != null) {
            if (!CurrentUser.isStaff()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            return ResponseEntity.ok(referralService.findForCenter(centerId));
        }
        if (status != null) {
            if (!CurrentUser.isStaff()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            return ResponseEntity.ok(referralService.findByStatus(status));
        }
        if (!CurrentUser.isStaff()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "parentId, studentId, or centerId is required unless you have an org-wide role");
        }
        return ResponseEntity.ok(referralService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Referral> getById(@PathVariable UUID id) {
        return referralService.findById(id)
                .map(r -> {
                    if (!canViewReferral(r)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
                    }
                    return r;
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Referral> create(@Valid @RequestBody Referral referral) {
        if (!CurrentUser.isStaff()) {
            UUID self = CurrentUser.id().orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
            referral.setReferrerUserId(self);
        }
        return ResponseEntity.ok(referralService.create(referral));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Referral> update(@PathVariable UUID id, @RequestBody Referral patch) {
        Optional<Referral> existing = referralService.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Referral r = existing.get();
        if (!CurrentUser.isStaff()) {
            if (!CurrentUser.id().map(r.getReferrerUserId()::equals).orElse(false)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
        }
        return referralService.update(id, patch)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<Referral> markConverted(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        UUID studentId = body.get("studentId") != null ? UUID.fromString(body.get("studentId")) : null;
        return referralService.markConverted(id, studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        referralService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private boolean canAccessStudentReferrals(UUID studentId) {
        if (CurrentUser.isStaff()) {
            return true;
        }
        Optional<UUID> uid = CurrentUser.id();
        if (uid.isEmpty()) {
            return false;
        }
        if (studentParentRepository.existsByStudentIdAndParentId(studentId, uid.get())) {
            return true;
        }
        return studentRepository.findById(studentId)
                .map(Student::getUserId)
                .map(u -> u.equals(uid.get()))
                .orElse(false);
    }

    private boolean canViewReferral(Referral r) {
        if (CurrentUser.isStaff()) {
            return true;
        }
        Optional<UUID> uid = CurrentUser.id();
        if (uid.isEmpty()) {
            return false;
        }
        if (r.getReferrerUserId() != null && r.getReferrerUserId().equals(uid.get())) {
            return true;
        }
        if (r.getStudentId() != null) {
            return studentRepository.findById(r.getStudentId())
                    .map(Student::getUserId)
                    .map(u -> u.equals(uid.get()))
                    .orElse(false);
        }
        return false;
    }
}
