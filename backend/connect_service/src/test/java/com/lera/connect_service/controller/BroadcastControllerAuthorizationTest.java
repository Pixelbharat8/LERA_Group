package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Notification;
import com.lera.connect_service.repository.NotificationRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectTestAuth;
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
class BroadcastControllerAuthorizationTest {

    @Mock
    private NotificationRepository notificationRepository;

    private BroadcastController controller;

    private final UUID centerA = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID centerB = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        controller = new BroadcastController(notificationRepository);
    }

    @Test
    void listBroadcasts_centerManager_seesOnlyOwnCenter() {
        Notification a = new Notification();
        a.setId(UUID.randomUUID());
        a.setCenterId(centerA);
        a.setUserId(null);
        Notification b = new Notification();
        b.setId(UUID.randomUUID());
        b.setCenterId(centerB);
        b.setUserId(null);
        when(notificationRepository.findByUserIdIsNullOrderByCreatedAtDesc())
                .thenReturn(List.of(a, b));

        AuthUser manager = ConnectTestAuth.centerManager(centerA);
        var res = controller.getAllBroadcasts(null, manager);
        assertEquals(200, res.getStatusCode().value());
        assertEquals(1, res.getBody().size());
    }

    @Test
    void listBroadcasts_centerManager_otherCenterParam_forbidden() {
        AuthUser manager = ConnectTestAuth.centerManager(centerA);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getAllBroadcasts(centerB, manager));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
