package com.lera.academy_service.controller;

import com.lera.academy_service.entity.StudentParent;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.security.AuthUser;
import com.lera.academy_service.security.StudentParentAccessPolicy;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentParentControllerTest {

    @Mock private StudentParentRepository studentParentRepository;
    @Mock private StudentParentAccessPolicy studentParentAccessPolicy;
    @Mock private com.lera.academy_service.security.AcademyAuthorizationService authz;

    @InjectMocks private StudentParentController controller;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAll_unfiltered_parent_forbidden() {
        login("PARENT", UUID.randomUUID());
        assertThatThrownBy(() -> controller.getAll(null, null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(403));
        verify(studentParentRepository, never()).findAll();
    }

    @Test
    void getAll_unfiltered_staff_ok() {
        login("TEACHER", UUID.randomUUID());
        when(authz.isOrgWide()).thenReturn(true); // unfiltered listing now requires an org-wide role
        when(studentParentRepository.findAll()).thenReturn(List.of());
        assertThat(controller.getAll(null, null).getBody()).isEmpty();
        verify(studentParentRepository).findAll();
    }

    @Test
    void getAll_parentId_other_forbidden() {
        login("PARENT", UUID.randomUUID());
        assertThatThrownBy(() -> controller.getAll(UUID.randomUUID(), null))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void getAll_parentId_self_ok() {
        UUID me = UUID.randomUUID();
        login("PARENT", me);
        when(studentParentRepository.findByParentId(me)).thenReturn(List.of());
        controller.getAll(me, null);
        verify(studentParentRepository).findByParentId(me);
    }

    @Test
    void getAll_studentId_linkedParent_ok() {
        UUID studentPk = UUID.randomUUID();
        login("PARENT", UUID.randomUUID());
        when(studentParentAccessPolicy.canAccessStudentLinkData(studentPk)).thenReturn(true);
        when(studentParentRepository.findByStudentId(studentPk)).thenReturn(List.of());
        controller.getAll(null, studentPk);
        verify(studentParentRepository).findByStudentId(studentPk);
    }

    @Test
    void getByStudent_sameRules_asStudentFilter() {
        UUID studentPk = UUID.randomUUID();
        login("STUDENT", UUID.randomUUID());
        when(studentParentAccessPolicy.canAccessStudentLinkData(studentPk)).thenReturn(true);
        when(studentParentRepository.findByStudentId(studentPk)).thenReturn(List.of());
        controller.getByStudent(studentPk);
        verify(studentParentRepository).findByStudentId(studentPk);
    }

    @Test
    void getById_row_parentOwnRow_ok() {
        UUID parentUser = UUID.randomUUID();
        UUID rowId = UUID.randomUUID();
        StudentParent sp = StudentParent.builder()
                .id(rowId)
                .parentId(parentUser)
                .studentId(UUID.randomUUID())
                .relationship("Mother")
                .build();
        login("PARENT", parentUser);
        when(studentParentRepository.findById(rowId)).thenReturn(Optional.of(sp));
        when(studentParentAccessPolicy.canAccessStudentParentRow(sp)).thenReturn(true);
        assertThat(controller.getById(rowId).getBody()).isEqualTo(sp);
    }

    @Test
    void getById_row_stranger_forbidden() {
        UUID rowId = UUID.randomUUID();
        UUID stranger = UUID.randomUUID();
        StudentParent sp = StudentParent.builder()
                .id(rowId)
                .parentId(UUID.randomUUID())
                .studentId(UUID.randomUUID())
                .relationship("Mother")
                .build();
        login("PARENT", stranger);
        when(studentParentRepository.findById(rowId)).thenReturn(Optional.of(sp));
        when(studentParentAccessPolicy.canAccessStudentParentRow(sp)).thenReturn(false);
        assertThatThrownBy(() -> controller.getById(rowId))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(403));
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
