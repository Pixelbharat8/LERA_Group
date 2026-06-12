package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InternalStudentAccessControllerTest {

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private StudentParentRepository studentParentRepository;

    private InternalStudentAccessController controller;

    private final UUID studentEntity = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID studentUser = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final UUID parentUser = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private final UUID outsider = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");

    @BeforeEach
    void setUp() {
        controller = new InternalStudentAccessController(studentRepository, studentParentRepository);
    }

    @Test
    void visibleToUser_studentSelf_noContent() {
        Student student = Student.builder().id(studentEntity).userId(studentUser).build();
        when(studentRepository.findById(studentEntity)).thenReturn(Optional.of(student));

        ResponseEntity<Void> res = controller.visibleToUser(studentEntity, studentUser);
        assertEquals(HttpStatus.NO_CONTENT, res.getStatusCode());
    }

    @Test
    void visibleToUser_outsider_forbidden() {
        when(studentParentRepository.existsByStudentIdAndParentId(studentEntity, outsider)).thenReturn(false);
        when(studentRepository.findById(studentEntity)).thenReturn(Optional.empty());

        ResponseEntity<Void> res = controller.visibleToUser(studentEntity, outsider);
        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode());
    }

    @Test
    void visibleToUser_linkedParent_noContent() {
        when(studentParentRepository.existsByStudentIdAndParentId(studentEntity, parentUser)).thenReturn(true);

        ResponseEntity<Void> res = controller.visibleToUser(studentEntity, parentUser);
        assertEquals(HttpStatus.NO_CONTENT, res.getStatusCode());
    }
}
