package com.lera.academy_service.service;

import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private StudentService studentService;

    private Student testStudent;
    private UUID studentId;

    @BeforeEach
    void setUp() {
        studentId = UUID.randomUUID();
        testStudent = new Student();
        testStudent.setId(studentId);
        testStudent.setFullname("Nguyen Van A");
        testStudent.setStudentCode("STU-001");
        testStudent.setEmail("student@lera.com");
        testStudent.setStatus("ACTIVE");
        testStudent.setCenterId(UUID.randomUUID());
    }

    @Test
    void findAll_shouldReturnAllStudents() {
        when(studentRepository.findAll()).thenReturn(List.of(testStudent));
        List<Student> result = studentService.findAll();
        assertEquals(1, result.size());
        assertEquals("Nguyen Van A", result.get(0).getFullname());
    }

    @Test
    void findAll_paginated_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Student> page = new PageImpl<>(List.of(testStudent), pageable, 1);
        when(studentRepository.findAll(pageable)).thenReturn(page);

        Page<Student> result = studentService.findAll(pageable);
        assertEquals(1, result.getTotalElements());
        assertEquals("STU-001", result.getContent().get(0).getStudentCode());
    }

    @Test
    void findById_shouldReturnStudent() {
        when(studentRepository.findById(studentId)).thenReturn(Optional.of(testStudent));
        Optional<Student> result = studentService.findById(studentId);
        assertTrue(result.isPresent());
        assertEquals("Nguyen Van A", result.get().getFullname());
    }

    @Test
    void findById_shouldReturnEmpty_whenNotFound() {
        UUID randomId = UUID.randomUUID();
        when(studentRepository.findById(randomId)).thenReturn(Optional.empty());
        Optional<Student> result = studentService.findById(randomId);
        assertFalse(result.isPresent());
    }

    @Test
    void findByCode_shouldReturnStudent() {
        when(studentRepository.findByStudentCode("STU-001")).thenReturn(Optional.of(testStudent));
        Optional<Student> result = studentService.findByCode("STU-001");
        assertTrue(result.isPresent());
    }

    @Test
    void findByCenterId_shouldReturnStudents() {
        UUID centerId = testStudent.getCenterId();
        when(studentRepository.findByCenterId(centerId)).thenReturn(List.of(testStudent));
        List<Student> result = studentService.findByCenterId(centerId);
        assertEquals(1, result.size());
    }

    @Test
    void search_shouldDelegateToRepository() {
        when(studentRepository.searchStudents("Nguyen")).thenReturn(List.of(testStudent));
        List<Student> result = studentService.search("Nguyen");
        assertEquals(1, result.size());
    }

    @Test
    void create_shouldSetDefaults() {
        Student newStudent = new Student();
        newStudent.setFullname("New Student");
        newStudent.setStudentCode("STU-002");

        when(studentRepository.findByStudentCode("STU-002")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        Student result = studentService.create(newStudent);
        assertEquals("ACTIVE", result.getStatus());
        assertNotNull(result.getCreatedAt());
    }

    @Test
    void create_shouldThrow_whenDuplicateCode() {
        Student dup = new Student();
        dup.setStudentCode("STU-001");
        when(studentRepository.findByStudentCode("STU-001")).thenReturn(Optional.of(testStudent));

        assertThrows(IllegalArgumentException.class, () -> studentService.create(dup));
    }

    @Test
    void update_shouldUpdateFields() {
        Student details = new Student();
        details.setFullname("Updated Name");
        details.setEmail("updated@lera.com");

        when(studentRepository.findById(studentId)).thenReturn(Optional.of(testStudent));
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<Student> result = studentService.update(studentId, details);
        assertTrue(result.isPresent());
        assertEquals("Updated Name", result.get().getFullname());
        assertEquals("updated@lera.com", result.get().getEmail());
        assertNotNull(result.get().getUpdatedAt());
    }

    @Test
    void update_shouldReturnEmpty_whenNotFound() {
        UUID randomId = UUID.randomUUID();
        when(studentRepository.findById(randomId)).thenReturn(Optional.empty());
        Optional<Student> result = studentService.update(randomId, new Student());
        assertFalse(result.isPresent());
    }

    @Test
    void updateStatus_shouldChangeStatus() {
        when(studentRepository.findById(studentId)).thenReturn(Optional.of(testStudent));
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<Student> result = studentService.updateStatus(studentId, "GRADUATED");
        assertTrue(result.isPresent());
        assertEquals("GRADUATED", result.get().getStatus());
    }

    @Test
    void delete_shouldReturnTrue_whenExists() {
        when(studentRepository.existsById(studentId)).thenReturn(true);
        assertTrue(studentService.delete(studentId));
        verify(studentRepository).deleteById(studentId);
    }

    @Test
    void delete_shouldReturnFalse_whenNotExists() {
        UUID randomId = UUID.randomUUID();
        when(studentRepository.existsById(randomId)).thenReturn(false);
        assertFalse(studentService.delete(randomId));
        verify(studentRepository, never()).deleteById(any());
    }

    @Test
    void countByCenterId_shouldReturnCount() {
        UUID centerId = testStudent.getCenterId();
        when(studentRepository.countByCenterId(centerId)).thenReturn(42L);
        assertEquals(42L, studentService.countByCenterId(centerId));
    }

    @Test
    void createBulk_shouldSetDefaultsForAll() {
        Student s1 = new Student();
        s1.setFullname("Student 1");
        Student s2 = new Student();
        s2.setFullname("Student 2");

        when(studentRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        List<Student> result = studentService.createBulk(List.of(s1, s2));
        assertEquals(2, result.size());
        result.forEach(s -> {
            assertEquals("ACTIVE", s.getStatus());
            assertNotNull(s.getCreatedAt());
        });
    }
}
