package com.lera.connect_service.service;

import com.lera.connect_service.entity.DeviceToken;
import com.lera.connect_service.repository.DeviceTokenRepository;
import com.lera.connect_service.service.push.ApnsClient;
import com.lera.connect_service.service.push.FcmClient;
import com.lera.connect_service.service.push.PushResult;
import com.lera.connect_service.service.push.WebPushClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Behaviour tests for {@link PushDispatcher}: who gets called, who doesn't,
 * what happens when providers aren't configured, and how dead tokens get
 * cleaned up.
 */
@ExtendWith(MockitoExtension.class)
class PushDispatcherTest {

    @Mock private DeviceTokenRepository tokens;
    @Mock private ApnsClient apns;
    @Mock private FcmClient fcm;
    @Mock private WebPushClient webPush;

    @InjectMocks private PushDispatcher dispatcher;

    @BeforeEach
    void enableDispatcher() {
        ReflectionTestUtils.setField(dispatcher, "enabled", true);
    }

    private static final String SAMPLE_SUB =
            "{\"endpoint\":\"https://example.com/push/x\",\"keys\":{\"p256dh\":\"dGVzdA\",\"auth\":\"dGVzdA\"}}";

    @Test
    void dryRun_doesNotCallProviders() {
        ReflectionTestUtils.setField(dispatcher, "enabled", false);
        UUID user = UUID.randomUUID();
        when(tokens.findByUserId(user)).thenReturn(List.of(
                deviceToken(user, "IOS", "ios-token-aaaaaaaaaaaa"),
                deviceToken(user, "ANDROID", "fcm-token-bbbbbbbbbbbb")));

        dispatcher.send(user, "T", "B");

        verifyNoInteractions(apns);
        verifyNoInteractions(fcm);
        verifyNoInteractions(webPush);
        verify(tokens, never()).deleteByToken(anyString());
    }

    @Test
    void emptyTokenList_isNoop() {
        UUID user = UUID.randomUUID();
        when(tokens.findByUserId(user)).thenReturn(List.of());
        dispatcher.send(user, "T", "B");
        verifyNoInteractions(apns);
        verifyNoInteractions(fcm);
        verifyNoInteractions(webPush);
    }

    @Test
    void iosTokenRoutesToApns_whenConfigured() {
        UUID user = UUID.randomUUID();
        when(tokens.findByUserId(user)).thenReturn(List.of(deviceToken(user, "IOS", "ios-tok")));
        when(apns.isConfigured()).thenReturn(true);
        when(apns.send(eq("ios-tok"), eq("Title"), eq("Body"), isNull())).thenReturn(PushResult.DELIVERED);

        dispatcher.send(user, "Title", "Body");

        verify(apns).send("ios-tok", "Title", "Body", null);
        verifyNoInteractions(fcm);
        verifyNoInteractions(webPush);
        verify(tokens, never()).deleteByToken(anyString());
    }

    @Test
    void androidAndPlainWebFcmTokensRouteToFcm() {
        UUID user = UUID.randomUUID();
        when(tokens.findByUserId(user)).thenReturn(List.of(
                deviceToken(user, "ANDROID", "fcm-a"),
                deviceToken(user, "WEB", "plain-fcm-registration-token-not-json")));
        when(fcm.isConfigured()).thenReturn(true);
        when(fcm.send(anyString(), anyString(), anyString(), any())).thenReturn(PushResult.DELIVERED);

        dispatcher.send(user, "T", "B");

        verify(fcm, times(2)).send(anyString(), anyString(), anyString(), any());
        verifyNoInteractions(apns);
        verify(webPush, never()).send(anyString(), anyString(), anyString(), any());
    }

    @Test
    void webPushSubscriptionJsonRoutesToWebPushClient_notFcm() {
        UUID user = UUID.randomUUID();
        when(tokens.findByUserId(user)).thenReturn(List.of(deviceToken(user, "WEB", SAMPLE_SUB)));
        when(webPush.isConfigured()).thenReturn(true);
        when(webPush.send(eq(SAMPLE_SUB), eq("T"), eq("B"), isNull())).thenReturn(PushResult.DELIVERED);

        dispatcher.send(user, "T", "B");

        verify(webPush).send(SAMPLE_SUB, "T", "B", null);
        verify(fcm, never()).send(anyString(), anyString(), anyString(), any());
        verifyNoInteractions(apns);
    }

    @Test
    void unconfiguredProvider_skipsThatPlatformButContinuesOthers() {
        UUID user = UUID.randomUUID();
        when(tokens.findByUserId(user)).thenReturn(List.of(
                deviceToken(user, "IOS", "ios"),
                deviceToken(user, "ANDROID", "android")));
        when(apns.isConfigured()).thenReturn(false);
        when(fcm.isConfigured()).thenReturn(true);
        when(fcm.send(eq("android"), anyString(), anyString(), isNull())).thenReturn(PushResult.DELIVERED);

        dispatcher.send(user, "T", "B");

        verify(apns, never()).send(anyString(), anyString(), anyString(), any());
        verify(fcm).send("android", "T", "B", null);
        verifyNoInteractions(webPush);
    }

    @Test
    void nullUserId_meansBroadcastToAllRegisteredDevices() {
        when(tokens.findAll()).thenReturn(List.of(
                deviceToken(UUID.randomUUID(), "IOS", "i1"),
                deviceToken(UUID.randomUUID(), "IOS", "i2")));
        when(apns.isConfigured()).thenReturn(true);
        when(apns.send(anyString(), anyString(), anyString(), any())).thenReturn(PushResult.DELIVERED);

        dispatcher.send(null, "T", "B");

        verify(tokens).findAll();
        verify(apns, times(2)).send(anyString(), anyString(), anyString(), any());
    }

    @Test
    void providerException_doesNotPropagate() {
        UUID user = UUID.randomUUID();
        when(tokens.findByUserId(user)).thenReturn(List.of(deviceToken(user, "IOS", "ios")));
        when(apns.isConfigured()).thenReturn(true);
        when(apns.send(anyString(), anyString(), anyString(), any()))
                .thenThrow(new RuntimeException("network down"));

        dispatcher.send(user, "T", "B");
        verify(tokens, never()).deleteByToken(anyString());
    }

    @Test
    void deadToken_isDeleted() {
        UUID user = UUID.randomUUID();
        when(tokens.findByUserId(user)).thenReturn(List.of(
                deviceToken(user, "IOS", "ios-dead"),
                deviceToken(user, "ANDROID", "fcm-live")));
        when(apns.isConfigured()).thenReturn(true);
        when(fcm.isConfigured()).thenReturn(true);
        when(apns.send(eq("ios-dead"), anyString(), anyString(), isNull())).thenReturn(PushResult.DEAD);
        when(fcm.send(eq("fcm-live"), anyString(), anyString(), isNull())).thenReturn(PushResult.DELIVERED);

        dispatcher.send(user, "T", "B");

        verify(tokens).deleteByToken("ios-dead");
        verify(tokens, never()).deleteByToken("fcm-live");
    }

    @Test
    void deadWebPushSubscription_deletesStoredJson() {
        UUID user = UUID.randomUUID();
        when(tokens.findByUserId(user)).thenReturn(List.of(deviceToken(user, "WEB", SAMPLE_SUB)));
        when(webPush.isConfigured()).thenReturn(true);
        when(webPush.send(eq(SAMPLE_SUB), anyString(), anyString(), isNull())).thenReturn(PushResult.DEAD);

        dispatcher.send(user, "T", "B");

        verify(tokens).deleteByToken(SAMPLE_SUB);
    }

    @Test
    void retryOutcome_doesNotDeleteToken() {
        UUID user = UUID.randomUUID();
        when(tokens.findByUserId(user)).thenReturn(List.of(deviceToken(user, "IOS", "ios-flaky")));
        when(apns.isConfigured()).thenReturn(true);
        when(apns.send(anyString(), anyString(), anyString(), any())).thenReturn(PushResult.RETRY);

        dispatcher.send(user, "T", "B");

        verify(tokens, never()).deleteByToken(anyString());
    }

    private static DeviceToken deviceToken(UUID userId, String platform, String token) {
        DeviceToken t = new DeviceToken();
        t.setUserId(userId);
        t.setPlatform(platform);
        t.setToken(token);
        return t;
    }
}
