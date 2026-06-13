package com.lera.connect_service.service;

import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectTestAuth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AcademyStudentAccessClientTest {

    @Mock
    private RestTemplate restTemplate;

    private AcademyStudentAccessClient client;

    private final UUID studentEntity = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID studentUser = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        client = new AcademyStudentAccessClient(restTemplate);
        ReflectionTestUtils.setField(client, "internalApiKey", "test-internal-key");
        ReflectionTestUtils.setField(client, "academyBaseUrl", "http://localhost:8082");
    }

    @Test
    void assertCanAccessStudentEntity_staff_skipsAcademy() {
        AuthUser teacher = ConnectTestAuth.participant(studentUser);
        teacher.setRoleName("TEACHER");
        client.assertCanAccessStudentEntity(teacher, studentEntity);
    }

    @Test
    void assertCanAccessStudentEntity_student_allowedByAcademy() {
        AuthUser student = ConnectTestAuth.participant(studentUser);
        student.setRoleName("STUDENT");
        when(restTemplate.exchange(
                contains("/visible-to-user/"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(Void.class)))
                .thenReturn(ResponseEntity.noContent().build());

        client.assertCanAccessStudentEntity(student, studentEntity);
    }

    @Test
    void assertCanAccessStudentEntity_student_forbiddenByAcademy() {
        AuthUser student = ConnectTestAuth.participant(studentUser);
        student.setRoleName("STUDENT");
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(Void.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.FORBIDDEN, "Forbidden", null, null, null));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> client.assertCanAccessStudentEntity(student, studentEntity));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
