package com.lera.academy_service.controller;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.PermissionSlip;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.PermissionSlipRepository;
import com.lera.academy_service.repository.PermissionSlipResponseRepository;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import com.lera.academy_service.security.AuthUser;
import com.lera.academy_service.service.PermissionSlipNotifier;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Authorisation tests for {@link PermissionSlipController} — the heart of the
 * consent-form workflow and the loophole-prone surface area we hardened over
 * the last two rounds.
 *
 * <p>What we lock in here:
 * <ul>
 *   <li>{@code createdBy} is server-stamped from the JWT (never trusted from the body)</li>
 *   <li>Teachers can only target classes they actually teach</li>
 *   <li>Centre managers are bounded to their own centre</li>
 *   <li>Whole-school slips need an elevated role</li>
 *   <li>Soft-delete: GET 404 after DELETE; the row itself stays for audit</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class PermissionSlipControllerTest {

    @Mock private PermissionSlipRepository slipRepo;
    @Mock private PermissionSlipResponseRepository responseRepo;
    @Mock private PermissionSlipNotifier notifier;
    @Mock private StudentParentRepository studentParentRepo;
    @Mock private StudentRepository studentRepo;
    @Mock private EnrollmentRepository enrollmentRepo;
    @Mock private ClassRepository classRepo;

    @InjectMocks private PermissionSlipController controller;

    @AfterEach void clearContext() { SecurityContextHolder.clearContext(); }

    // ---------- create() ----------

    @Test
    void create_stampsCreatedByFromJwt_ignoringBody() {
        UUID chair = UUID.randomUUID();
        UUID attacker = UUID.randomUUID();
        login("CHAIRMAN", chair, null);

        PermissionSlip body = wholeSchool();
        body.setCreatedBy(attacker); // attacker tries to forge author
        lenient().when(slipRepo.save(any(PermissionSlip.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        var saved = controller.create(body).getBody();
        assertThat(saved.getCreatedBy()).isEqualTo(chair);
    }

    @Test
    void create_chairman_canSendWholeSchoolSlip() {
        login("CHAIRMAN", UUID.randomUUID(), null);
        lenient().when(slipRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        controller.create(wholeSchool()); // no throw
        verify(notifier).notifySlipCreated(any());
    }

    @Test
    void create_centerManager_cannotSendWholeSchool() {
        login("CENTER_MANAGER", UUID.randomUUID(), UUID.randomUUID());
        assertThatThrownBy(() -> controller.create(wholeSchool()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Whole-school");
        verify(slipRepo, never()).save(any());
    }

    @Test
    void create_centerManager_canSendOwnCentre_butNotForeignCentre() {
        UUID myCentre = UUID.randomUUID();
        UUID otherCentre = UUID.randomUUID();
        login("CENTER_MANAGER", UUID.randomUUID(), myCentre);
        lenient().when(slipRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PermissionSlip own = new PermissionSlip();
        own.setTitle("Own");
        own.setCenterId(myCentre);
        controller.create(own); // no throw

        PermissionSlip foreign = new PermissionSlip();
        foreign.setTitle("Foreign");
        foreign.setCenterId(otherCentre);
        assertThatThrownBy(() -> controller.create(foreign))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("own centre");
    }

    @Test
    void create_teacher_canTargetOwnClass() {
        UUID me = UUID.randomUUID();
        UUID classId = UUID.randomUUID();
        login("TEACHER", me, null);
        ClassEntity klass = new ClassEntity();
        klass.setId(classId);
        klass.setTeacherId(me);
        when(classRepo.findById(classId)).thenReturn(Optional.of(klass));
        lenient().when(slipRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PermissionSlip slip = new PermissionSlip();
        slip.setTitle("Field trip");
        slip.setClassId(classId);
        controller.create(slip); // no throw
    }

    @Test
    void create_teacher_canTargetClassWhereTheyAreAssistant() {
        UUID me = UUID.randomUUID();
        UUID classId = UUID.randomUUID();
        login("TEACHER", me, null);
        ClassEntity klass = new ClassEntity();
        klass.setId(classId);
        klass.setTeacherId(UUID.randomUUID());
        klass.setAssistantTeacherId(me);
        when(classRepo.findById(classId)).thenReturn(Optional.of(klass));
        lenient().when(slipRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PermissionSlip slip = new PermissionSlip();
        slip.setTitle("Field trip");
        slip.setClassId(classId);
        controller.create(slip); // no throw
    }

    @Test
    void create_teacher_cannotTargetForeignClass() {
        UUID me = UUID.randomUUID();
        UUID foreignClass = UUID.randomUUID();
        login("TEACHER", me, null);
        ClassEntity klass = new ClassEntity();
        klass.setId(foreignClass);
        klass.setTeacherId(UUID.randomUUID());
        when(classRepo.findById(foreignClass)).thenReturn(Optional.of(klass));

        PermissionSlip slip = new PermissionSlip();
        slip.setTitle("Hijack attempt");
        slip.setClassId(foreignClass);
        assertThatThrownBy(() -> controller.create(slip))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("classes you teach");
        verify(slipRepo, never()).save(any());
    }

    @Test
    void create_teacher_cannotSendCentreOrSchoolWide() {
        login("TEACHER", UUID.randomUUID(), null);

        PermissionSlip centre = new PermissionSlip();
        centre.setTitle("Centre-wide");
        centre.setCenterId(UUID.randomUUID());
        assertThatThrownBy(() -> controller.create(centre))
                .isInstanceOf(ResponseStatusException.class);

        PermissionSlip whole = wholeSchool();
        assertThatThrownBy(() -> controller.create(whole))
                .isInstanceOf(ResponseStatusException.class);
    }

    // ---------- delete() — soft-delete ----------

    @Test
    void delete_marksDeletedAt_butKeepsTheRow() {
        login("CHAIRMAN", UUID.randomUUID(), null);
        UUID id = UUID.randomUUID();
        PermissionSlip slip = new PermissionSlip();
        slip.setId(id);
        slip.setStatus("OPEN");
        when(slipRepo.findById(id)).thenReturn(Optional.of(slip));
        when(slipRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = controller.delete(id);
        assertThat(resp.getStatusCode().value()).isEqualTo(204);
        assertThat(slip.getDeletedAt()).isNotNull();
        assertThat(slip.getStatus()).isEqualTo("DELETED");
        verify(slipRepo).save(slip);
        // Responses are kept for audit.
        verify(responseRepo, never()).deleteById(any());
    }

    @Test
    void delete_alreadyDeletedSlip_returns404() {
        login("CHAIRMAN", UUID.randomUUID(), null);
        UUID id = UUID.randomUUID();
        PermissionSlip slip = new PermissionSlip();
        slip.setId(id);
        slip.setDeletedAt(LocalDateTime.now().minusDays(1));
        when(slipRepo.findById(id)).thenReturn(Optional.of(slip));

        var resp = controller.delete(id);
        assertThat(resp.getStatusCode().value()).isEqualTo(404);
    }

    // ---------- get() — single-slip authz ----------

    @Test
    void get_softDeletedSlip_isNotFound() {
        login("CHAIRMAN", UUID.randomUUID(), null);
        UUID id = UUID.randomUUID();
        PermissionSlip s = new PermissionSlip();
        s.setId(id);
        s.setDeletedAt(LocalDateTime.now());
        when(slipRepo.findById(id)).thenReturn(Optional.of(s));

        var resp = controller.get(id);
        assertThat(resp.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void get_staff_canReadAnySlip() {
        login("DIRECTOR", UUID.randomUUID(), null);
        UUID id = UUID.randomUUID();
        PermissionSlip s = new PermissionSlip();
        s.setId(id);
        s.setClassId(UUID.randomUUID());
        when(slipRepo.findById(id)).thenReturn(Optional.of(s));

        var resp = controller.get(id);
        assertThat(resp.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void get_parent_cannotReadOtherClassesSlip_returns404() {
        UUID parent = UUID.randomUUID();
        login("PARENT", parent, null);

        UUID slipId = UUID.randomUUID();
        PermissionSlip foreign = new PermissionSlip();
        foreign.setId(slipId);
        foreign.setClassId(UUID.randomUUID()); // a class the parent has no child in
        when(slipRepo.findById(slipId)).thenReturn(Optional.of(foreign));
        // Parent has no children at all.
        when(studentParentRepo.findByParentId(parent)).thenReturn(List.of());
        when(studentRepo.findByParentId(parent)).thenReturn(List.of());
        when(studentRepo.findAllById(any())).thenReturn(List.of());

        var resp = controller.get(slipId);
        assertThat(resp.getStatusCode().value()).isEqualTo(404);
    }

    // ---------- helpers ----------

    private static PermissionSlip wholeSchool() {
        PermissionSlip s = new PermissionSlip();
        s.setTitle("School-wide");
        return s;
    }

    private static void login(String role, UUID userId, UUID centreId) {
        AuthUser u = AuthUser.builder()
                .userId(userId).centerId(centreId).roleName(role).email("t@t").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(u, "n/a", List.of()));
    }
}
