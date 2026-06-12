package com.lera.connect_service.service;

import com.lera.connect_service.entity.Notification;
import com.lera.connect_service.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    // NotificationService now invokes PushDispatcher.send(...) on every save.
    // Mock it so the assertions can focus on the persistence side without
    // exercising the (real) APNs/FCM stack.
    @Mock
    private PushDispatcher pushDispatcher;

    @InjectMocks
    private NotificationService notificationService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Test
    void createNotification_shouldSetDefaults() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        Notification result = notificationService.createNotification(userId, "Test Title", "Test message", "INFO");
        assertNotNull(result);
        assertEquals(userId, result.getUserId());
        assertEquals("Test Title", result.getTitle());
        assertFalse(result.getIsRead());
        assertNotNull(result.getCreatedAt());
    }

    @Test
    void createBroadcastNotification_shouldHaveNullUserId() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        Notification result = notificationService.createBroadcastNotification("Broadcast", "Thông báo", "Hello", "Xin chào", "ANNOUNCEMENT");
        assertNull(result.getUserId());
        assertEquals("Broadcast", result.getTitle());
        assertEquals("Thông báo", result.getTitleVi());
    }

    @Test
    void createNotificationsForUsers_shouldCreateMultiple() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        List<UUID> userIds = List.of(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
        UUID refId = UUID.randomUUID();

        List<Notification> result = notificationService.createNotificationsForUsers(
                userIds, "Title", "Message", "INFO", "LEAVE", refId);

        assertEquals(3, result.size());
        verify(notificationRepository, times(3)).save(any(Notification.class));
    }

    @Test
    void notifyLeaveApplication_shouldReturnList() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        List<Notification> result = notificationService.notifyLeaveApplication(
                userId, "John Doe", "Annual", "2026-05-01", "2026-05-05");
        assertEquals(1, result.size());
        assertEquals("Leave Application Received", result.get(0).getTitle());
    }

    @Test
    void createNotificationWithVi_shouldSetVietnameseFields() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        Notification result = notificationService.createNotificationWithVi(
                userId, "Title", "Tiêu đề", "Message", "Tin nhắn", "INFO", null, null);
        assertEquals("Tiêu đề", result.getTitleVi());
        assertEquals("Tin nhắn", result.getMessageVi());
    }
}
