package com.lera.academy_service.controller;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.PermissionSlip;
import com.lera.academy_service.entity.PermissionSlipResponse;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.entity.StudentParent;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.PermissionSlipRepository;
import com.lera.academy_service.repository.PermissionSlipResponseRepository;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AuthUser;
import com.lera.academy_service.security.CurrentUser;
import com.lera.academy_service.service.PermissionSlipNotifier;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Permission slips (consent forms) for parent approval of student activities.
 *
 * <p>Authorization model:
 * <ul>
 *   <li>List/get is permitted for every signed-in role; the parent UI only
 *       shows what's relevant.</li>
 *   <li>Create/Update/Delete is restricted to staff.</li>
 *   <li>{@code POST /{id}/respond} derives the parentId from the JWT — body
 *       cannot override it (closed loophole: previously a parent could record
 *       a response under another parent's name).</li>
 *   <li>{@code GET /{id}/responses} (full list) is staff-only.</li>
 *   <li>{@code GET /parent/{parentId}/responses} only works if the caller is
 *       that parent or a staff role.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/permission-slips")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class PermissionSlipController {

    private final PermissionSlipRepository slipRepo;
    private final PermissionSlipResponseRepository responseRepo;
    private final PermissionSlipNotifier notifier;
    private final StudentParentRepository studentParentRepo;
    private final StudentRepository studentRepo;
    private final EnrollmentRepository enrollmentRepo;
    private final ClassRepository classRepo;
    private final AcademyAuthorizationService authz;

    /** Roles that may create a slip targeting any class / centre. */
    private static final Set<String> ELEVATED_STAFF = Set.of(
            "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR");
    /** Roles whose targeting is bounded by their own centre. */
    private static final Set<String> CENTRE_BOUND_STAFF = Set.of(
            "CENTER_MANAGER", "CENTER_ADMIN", "STAFF");

    /**
     * List slips. Staff sees everything; non-staff (parents, students) see
     * only what could plausibly apply to them — whole-school slips, slips
     * targeted at a center their child is in, and slips targeted at a class
     * their child is enrolled in. This closes the enumeration loophole
     * where any signed-in parent could read every other class's slips.
     */
    @GetMapping
    public ResponseEntity<List<PermissionSlip>> list(
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) String status) {
        List<PermissionSlip> base;
        if (classId != null) {
            authz.assertCanViewClassRoster(classId);
            base = slipRepo.findByClassIdOrderByCreatedAtDesc(classId);
        } else if (centerId != null) {
            UUID effCenter = authz.effectiveListCenterId(centerId);
            base = slipRepo.findByCenterIdOrderByCreatedAtDesc(effCenter);
        } else if (status != null) {
            authz.assertStaff();
            if (!authz.isOrgWide()) {
                UUID effCenter = authz.effectiveListCenterId(null);
                base = slipRepo.findByCenterIdOrderByCreatedAtDesc(effCenter).stream()
                        .filter(s -> status.equalsIgnoreCase(s.getStatus()))
                        .collect(Collectors.toList());
            } else {
                base = slipRepo.findByStatusOrderByCreatedAtDesc(status);
            }
        } else if (CurrentUser.isStaff()) {
            if (!authz.isOrgWide()) {
                UUID effCenter = authz.effectiveListCenterId(null);
                base = slipRepo.findByCenterIdOrderByCreatedAtDesc(effCenter);
            } else {
                base = slipRepo.findAllByOrderByCreatedAtDesc();
            }
        } else {
            base = slipRepo.findAllByOrderByCreatedAtDesc();
        }

        if (CurrentUser.isStaff()) {
            return ResponseEntity.ok(base);
        }

        VisibilityScope scope = visibilityScopeForCurrentUser();
        if (scope == null) return ResponseEntity.ok(List.of());

        List<PermissionSlip> visible = base.stream()
                .filter(scope::canSee)
                .collect(Collectors.toList());

        return ResponseEntity.ok(visible);
    }

    /**
     * Single-slip read. Staff and the slip's author see it unconditionally.
     * Other roles must satisfy the same scope filter as {@link #list}: the
     * slip must be whole-school, or target a center / class their child is
     * in. Without this, a parent who somehow guesses or harvests an id from
     * another class could read its title, description and dates.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PermissionSlip> get(@PathVariable UUID id) {
        Optional<PermissionSlip> opt = slipRepo.findById(id);
        if (opt.isEmpty() || opt.get().getDeletedAt() != null) {
            return ResponseEntity.notFound().build();
        }
        PermissionSlip slip = opt.get();
        if (CurrentUser.isStaff()) return ResponseEntity.ok(slip);

        UUID me = CurrentUser.id().orElse(null);
        if (me != null && me.equals(slip.getCreatedBy())) {
            return ResponseEntity.ok(slip);
        }

        VisibilityScope scope = visibilityScopeForCurrentUser();
        if (scope != null && scope.canSee(slip)) return ResponseEntity.ok(slip);
        // We choose 404 over 403 to avoid leaking the existence of foreign slips.
        return ResponseEntity.notFound().build();
    }

    /** Holds the centre/class ids associated with the caller's children. */
    private static final class VisibilityScope {
        final Set<UUID> centerIds;
        final Set<UUID> classIds;
        VisibilityScope(Set<UUID> centerIds, Set<UUID> classIds) {
            this.centerIds = centerIds;
            this.classIds = classIds;
        }
        boolean canSee(PermissionSlip slip) {
            if (slip.getDeletedAt() != null) return false;
            if (slip.getClassId() == null && slip.getCenterId() == null) return true;
            if (slip.getCenterId() != null && centerIds.contains(slip.getCenterId())) return true;
            return slip.getClassId() != null && classIds.contains(slip.getClassId());
        }
    }

    private VisibilityScope visibilityScopeForCurrentUser() {
        UUID me = CurrentUser.id().orElse(null);
        if (me == null) return null;

        Set<UUID> myChildrenStudentIds = new HashSet<>();
        for (StudentParent sp : studentParentRepo.findByParentId(me)) {
            myChildrenStudentIds.add(sp.getStudentId());
        }
        for (Student s : studentRepo.findByParentId(me)) {
            myChildrenStudentIds.add(s.getId());
        }

        Set<UUID> myCenterIds = studentRepo.findAllById(myChildrenStudentIds).stream()
                .map(Student::getCenterId).filter(Objects::nonNull).collect(Collectors.toSet());

        Set<UUID> myClassIds = new HashSet<>();
        for (UUID studentId : myChildrenStudentIds) {
            for (Enrollment e : enrollmentRepo.findByStudentId(studentId)) {
                if (e.getClassId() != null) myClassIds.add(e.getClassId());
            }
        }
        return new VisibilityScope(myCenterIds, myClassIds);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<PermissionSlip> create(@Valid @RequestBody PermissionSlip slip) {
        // Stamp createdBy from the JWT, ignoring any client value, so audit
        // logs always reflect the actual author.
        CurrentUser.id().ifPresent(slip::setCreatedBy);
        // Verify the caller is allowed to target the class / centre on the
        // slip. Without this a teacher of class A could send a slip to class B.
        assertCallerCanTarget(slip);
        PermissionSlip saved = slipRepo.save(slip);
        // Best-effort fan-out — failure here must not roll back the slip.
        try {
            notifier.notifySlipCreated(saved);
        } catch (Exception e) {
            log.warn("Failed to publish permission-slip notification for {}: {}", saved.getId(), e.getMessage());
        }
        return ResponseEntity.ok(saved);
    }

    /**
     * Throw 403 if the caller's role/identity isn't allowed to send a slip
     * with the given targeting:
     *
     * <ul>
     *   <li>SUPER_ADMIN / CHAIRMAN / CEO / DIRECTOR — anything.</li>
     *   <li>CENTER_MANAGER / CENTER_ADMIN / STAFF — only classes / centres in
     *       their own centre. Whole-school slips are denied for centre-bound
     *       staff: those have to come from the elevated leadership roles.</li>
     *   <li>TEACHER — only classes they teach (primary or assistant). They
     *       cannot send centre-wide or whole-school slips.</li>
     * </ul>
     */
    private void assertCallerCanTarget(PermissionSlip slip) {
        AuthUser me = CurrentUser.get().orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        String role = me.getRoleName() == null ? "" : me.getRoleName().toUpperCase(Locale.ROOT);

        if (ELEVATED_STAFF.contains(role)) return;

        UUID classId = slip.getClassId();
        UUID centerId = slip.getCenterId();

        if (CENTRE_BOUND_STAFF.contains(role)) {
            if (classId == null && centerId == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Whole-school slips require an elevated role.");
            }
            if (centerId != null && !centerId.equals(me.getCenterId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You can only target your own centre.");
            }
            if (classId != null) {
                ClassEntity klass = classRepo.findById(classId).orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown classId."));
                if (klass.getCenterId() != null && !klass.getCenterId().equals(me.getCenterId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Class is in a different centre.");
                }
            }
            return;
        }

        if ("TEACHER".equals(role)) {
            if (classId == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Teachers must target a specific class they teach.");
            }
            ClassEntity klass = classRepo.findById(classId).orElseThrow(
                    () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown classId."));
            UUID myId = me.getUserId();
            boolean owns = myId != null
                    && (myId.equals(klass.getTeacherId()) || myId.equals(klass.getAssistantTeacherId()));
            if (!owns) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You can only send slips for classes you teach.");
            }
            return;
        }

        // Any other role that snuck past @PreAuthorize: hard deny.
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Role not permitted to create slips.");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<PermissionSlip> update(@PathVariable UUID id, @Valid @RequestBody PermissionSlip body) {
        return slipRepo.findById(id)
                .filter(s -> s.getDeletedAt() == null)
                .map(slip -> {
                    slip.setTitle(body.getTitle());
                    slip.setTitleVi(body.getTitleVi());
                    slip.setDescription(body.getDescription());
                    slip.setDescriptionVi(body.getDescriptionVi());
                    slip.setActivityDate(body.getActivityDate());
                    slip.setDueDate(body.getDueDate());
                    slip.setClassId(body.getClassId());
                    slip.setCenterId(body.getCenterId());
                    slip.setStatus(body.getStatus() != null ? body.getStatus() : slip.getStatus());
                    // createdBy is intentionally not editable through PUT.
                    return ResponseEntity.ok(slipRepo.save(slip));
                }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Soft-delete the slip. Responses are kept in place — the consent paper
     * trail must survive a button click. A future admin endpoint can purge
     * truly deleted rows after a retention window.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        return slipRepo.findById(id)
                .filter(s -> s.getDeletedAt() == null)
                .map(slip -> {
                    slip.setDeletedAt(LocalDateTime.now());
                    slip.setStatus("DELETED");
                    slipRepo.save(slip);
                    return ResponseEntity.noContent().<Void>build();
                }).orElse(ResponseEntity.notFound().build());
    }

    /** All responses for a slip (teacher / admin view). Parents must use the
     *  per-parent endpoint below — they shouldn't see other families' replies. */
    @GetMapping("/{id}/responses")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<List<PermissionSlipResponse>> responses(@PathVariable("id") UUID slipId) {
        return ResponseEntity.ok(responseRepo.findBySlipId(slipId));
    }

    /**
     * Parent records a Yes/No on behalf of a specific student. The {@code
     * parentId} field in the body is ignored — we always use the caller's
     * JWT-derived id (or any id, when a staff role is acting on behalf).
     */
    @PostMapping("/{id}/respond")
    public ResponseEntity<PermissionSlipResponse> respond(
            @PathVariable("id") UUID slipId,
            @Valid @RequestBody Map<String, Object> body) {

        PermissionSlip slip = slipRepo.findById(slipId).orElse(null);
        if (slip == null || slip.getDeletedAt() != null) return ResponseEntity.notFound().build();
        if ("CLOSED".equalsIgnoreCase(slip.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slip is closed.");
        }

        UUID studentId = parseUuid(body.get("studentId"));
        if (studentId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId is required.");
        }
        String response = String.valueOf(body.getOrDefault("response", "")).toUpperCase(Locale.ROOT);
        if (!"YES".equals(response) && !"NO".equals(response)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "response must be YES or NO.");
        }

        // Identity of the responder is derived from the JWT, not the body.
        // Staff can record on behalf via the optional parentIdOverride field.
        UUID callerId = CurrentUser.id().orElse(null);
        UUID parentId;
        Object override = body.get("parentIdOverride");
        if (override != null && CurrentUser.isStaff()) {
            parentId = parseUuid(override);
        } else {
            parentId = callerId;
        }
        if (parentId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated.");
        }

        PermissionSlipResponse rec = responseRepo
                .findBySlipIdAndStudentId(slipId, studentId)
                .orElseGet(PermissionSlipResponse::new);
        rec.setSlipId(slipId);
        rec.setStudentId(studentId);
        rec.setResponse(response);
        rec.setParentId(parentId);
        Object comment = body.get("comment");
        if (comment != null) rec.setComment(String.valueOf(comment));
        rec.setRespondedAt(LocalDateTime.now());
        return ResponseEntity.ok(responseRepo.save(rec));
    }

    /** A single parent's response history. Parents see only their own; staff see anyone's. */
    @GetMapping("/parent/{parentId}/responses")
    public ResponseEntity<List<PermissionSlipResponse>> byParent(@PathVariable UUID parentId) {
        if (!CurrentUser.isSelfOrStaff(parentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(responseRepo.findByParentId(parentId));
    }

    /** A parent's own response history — convenience wrapper around the
     *  per-parent endpoint that doesn't require the client to know its own id. */
    @GetMapping("/me/responses")
    public ResponseEntity<List<PermissionSlipResponse>> myResponses() {
        UUID me = CurrentUser.id().orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return ResponseEntity.ok(responseRepo.findByParentId(me));
    }

    private static UUID parseUuid(Object o) {
        if (o == null) return null;
        try {
            return UUID.fromString(String.valueOf(o));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
