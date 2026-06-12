package com.lera.connect_service.controller;

import com.lera.connect_service.repository.NotificationRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectTestAuth;
import com.lera.connect_service.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationControllerAuthorizationTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationService notificationService;

    private NotificationController controller;

    private final UUID alice = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID bob = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        controller = new NotificationController(notificationRepository, notificationService);
    }

    @Test
    void getByUser_self_ok() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(alice)).thenReturn(List.of());
        when(notificationRepository.findByUserIdIsNullOrderByCreatedAtDesc()).thenReturn(List.of());
        AuthUser user = ConnectTestAuth.participant(alice);
        var res = controller.getNotificationsByUser(alice, user);
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void getByUser_otherUser_forbidden() {
        AuthUser user = ConnectTestAuth.participant(alice);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getNotificationsByUser(bob, user));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void getByUser_orgWide_otherUser_ok() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(bob)).thenReturn(List.of());
        when(notificationRepository.findByUserIdIsNullOrderByCreatedAtDesc()).thenReturn(List.of());
        AuthUser orgWide = ConnectTestAuth.orgWide();
        var res = controller.getNotificationsByUser(bob, orgWide);
        assertEquals(200, res.getStatusCode().value());
    }
}
