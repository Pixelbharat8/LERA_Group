package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Referral;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import com.lera.academy_service.security.AuthUser;
import com.lera.academy_service.service.ReferralService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Locks in referral list/get/create/update authorisation added to close IDOR gaps.
 */
@ExtendWith(MockitoExtension.class)
class ReferralControllerTest {

    @Mock private ReferralService referralService;
    @Mock private StudentParentRepository studentParentRepository;
    @Mock private StudentRepository studentRepository;

    @InjectMocks private ReferralController controller;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void list_unfiltered_parent_isForbidden() {
        login("PARENT", UUID.randomUUID());
        assertThatThrownBy(() -> controller.listReferrals(null, null, null, null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(403));
        verify(referralService, never()).findAll();
    }

    @Test
    void list_unfiltered_staff_callsFindAll() {
        login("TEACHER", UUID.randomUUID());
        when(referralService.findAll()).thenReturn(List.of());
        assertThat(controller.listReferrals(null, null, null, null).getBody()).isEmpty();
        verify(referralService).findAll();
    }

    @Test
    void list_parentId_otherUser_forbidden() {
        UUID me = UUID.randomUUID();
        login("PARENT", me);
        assertThatThrownBy(() -> controller.listReferrals(UUID.randomUUID(), null, null, null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(403));
    }

    @Test
    void list_parentId_self_ok() {
        UUID me = UUID.randomUUID();
        login("PARENT", me);
        when(referralService.findForParent(me)).thenReturn(List.of());
        controller.listReferrals(me, null, null, null);
        verify(referralService).findForParent(me);
    }

    @Test
    void list_studentId_parentLinked_ok() {
        UUID parentUser = UUID.randomUUID();
        UUID studentPk = UUID.randomUUID();
        login("PARENT", parentUser);
        when(studentParentRepository.existsByStudentIdAndParentId(studentPk, parentUser)).thenReturn(true);
        when(referralService.findForStudent(studentPk)).thenReturn(List.of());
        controller.listReferrals(null, studentPk, null, null);
        verify(referralService).findForStudent(studentPk);
    }

    @Test
    void list_studentId_notLinked_forbidden() {
        UUID parentUser = UUID.randomUUID();
        UUID studentPk = UUID.randomUUID();
        login("PARENT", parentUser);
        when(studentParentRepository.existsByStudentIdAndParentId(studentPk, parentUser)).thenReturn(false);
        when(studentRepository.findById(studentPk)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> controller.listReferrals(null, studentPk, null, null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(403));
    }

    @Test
    void list_centerId_nonStaff_forbidden() {
        login("PARENT", UUID.randomUUID());
        assertThatThrownBy(() -> controller.listReferrals(null, null, UUID.randomUUID(), null))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void list_statusFilter_nonStaff_forbidden() {
        login("PARENT", UUID.randomUUID());
        assertThatThrownBy(() -> controller.listReferrals(null, null, null, "PENDING"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void create_parent_stampsReferrerFromJwt() {
        UUID self = UUID.randomUUID();
        login("PARENT", self);
        UUID attacker = UUID.randomUUID();
        Referral body = new Referral();
        body.setReferrerUserId(attacker);
        when(referralService.create(any(Referral.class))).thenAnswer(inv -> inv.getArgument(0));

        Referral saved = controller.create(body).getBody();
        assertThat(saved).isNotNull();
        assertThat(saved.getReferrerUserId()).isEqualTo(self);
    }

    @Test
    void create_staff_doesNotOverwriteReferrer() {
        UUID staff = UUID.randomUUID();
        UUID intendedReferrer = UUID.randomUUID();
        login("TEACHER", staff);
        Referral body = new Referral();
        body.setReferrerUserId(intendedReferrer);
        when(referralService.create(any(Referral.class))).thenAnswer(inv -> inv.getArgument(0));

        Referral saved = controller.create(body).getBody();
        assertThat(saved).isNotNull();
        assertThat(saved.getReferrerUserId()).isEqualTo(intendedReferrer);
    }

    @Test
    void getById_referrer_ok() {
        UUID rid = UUID.randomUUID();
        UUID parentUser = UUID.randomUUID();
        Referral r = new Referral();
        r.setId(rid);
        r.setReferrerUserId(parentUser);
        login("PARENT", parentUser);
        when(referralService.findById(rid)).thenReturn(Optional.of(r));

        assertThat(controller.getById(rid).getBody()).isEqualTo(r);
    }

    @Test
    void getById_stranger_forbidden() {
        UUID rid = UUID.randomUUID();
        Referral r = new Referral();
        r.setId(rid);
        r.setReferrerUserId(UUID.randomUUID());
        login("PARENT", UUID.randomUUID());
        when(referralService.findById(rid)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> controller.getById(rid))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(403));
    }

    @Test
    void getById_studentOwner_ok() {
        UUID rid = UUID.randomUUID();
        UUID studentPk = UUID.randomUUID();
        UUID studentUser = UUID.randomUUID();
        Referral r = new Referral();
        r.setId(rid);
        r.setReferrerUserId(UUID.randomUUID());
        r.setStudentId(studentPk);

        login("STUDENT", studentUser);
        when(referralService.findById(rid)).thenReturn(Optional.of(r));
        Student st = new Student();
        st.setId(studentPk);
        st.setUserId(studentUser);
        when(studentRepository.findById(studentPk)).thenReturn(Optional.of(st));

        assertThat(controller.getById(rid).getBody()).isEqualTo(r);
    }

    @Test
    void update_nonOwner_forbidden() {
        UUID id = UUID.randomUUID();
        Referral existing = new Referral();
        existing.setReferrerUserId(UUID.randomUUID());
        login("PARENT", UUID.randomUUID());
        when(referralService.findById(id)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> controller.update(id, new Referral()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(403));
        verify(referralService, never()).update(eq(id), any());
    }

    @Test
    void update_owner_ok() {
        UUID me = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        Referral existing = new Referral();
        existing.setReferrerUserId(me);
        login("PARENT", me);
        when(referralService.findById(id)).thenReturn(Optional.of(existing));
        Referral patch = new Referral();
        patch.setNotes("x");
        when(referralService.update(id, patch)).thenReturn(Optional.of(existing));

        assertThat(controller.update(id, patch).getStatusCode().value()).isEqualTo(200);
    }

    private static void login(String role, UUID userId) {
        AuthUser u = AuthUser.builder()
                .userId(userId)
                .roleName(role)
                .email("test@lera.io")
                .build();
        var auth = new UsernamePasswordAuthenticationToken(u, "n/a", java.util.List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
