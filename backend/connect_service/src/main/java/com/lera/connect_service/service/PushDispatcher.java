package com.lera.connect_service.service;

import com.lera.connect_service.entity.DeviceToken;
import com.lera.connect_service.repository.DeviceTokenRepository;
import com.lera.connect_service.service.push.ApnsClient;
import com.lera.connect_service.service.push.FcmClient;
import com.lera.connect_service.service.push.PushResult;
import com.lera.connect_service.service.push.WebPushClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Sends push notifications per platform:
 * <ul>
 *   <li>{@code IOS} → Apple Push Notification service (HTTP/2 + JWT).</li>
 *   <li>{@code ANDROID} → Firebase Cloud Messaging HTTP v1.</li>
 *   <li>{@code WEB} → either the <b>Web Push Protocol</b> (subscription JSON from
 *       {@code PushManager.subscribe}) when {@link WebPushClient} is configured,
 *       or FCM when the token is a raw FCM registration string (e.g. Firebase
 *       JS SDK {@code getToken()}).</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PushDispatcher {

    private final DeviceTokenRepository deviceTokenRepository;
    private final ApnsClient apns;
    private final FcmClient fcm;
    private final WebPushClient webPush;

    @Value("${lera.push.enabled:false}")
    private boolean enabled;

    public void send(UUID userId, String title, String body) {
        send(userId, title, body, null);
    }

    /**
     * Like {@link #send(UUID, String, String)} but attaches string key/value data for native handlers
     * (FCM {@code data}, APNs custom fields, Web Push JSON envelope).
     */
    public void send(UUID userId, String title, String body, Map<String, String> data) {
        List<DeviceToken> tokens = (userId == null)
                ? deviceTokenRepository.findAll()
                : deviceTokenRepository.findByUserId(userId);

        if (tokens.isEmpty()) {
            log.debug("push.send: no device tokens for {}",
                    userId == null ? "broadcast" : userId);
            return;
        }

        String label = userId == null ? "broadcast" : userId.toString();
        int delivered = 0, dryRun = 0, retry = 0, dead = 0;
        for (DeviceToken t : tokens) {
            if (!enabled) {
                dryRun++;
                log.info("[push:dry-run] {} -> {} ({}): {} | {} | data={}",
                        t.getPlatform(), label, mask(t.getToken()), title, body, data == null ? "{}" : data);
                continue;
            }
            try {
                PushResult outcome = deliver(t, title, body, data);
                switch (outcome) {
                    case DELIVERED -> delivered++;
                    case RETRY -> retry++;
                    case DEAD -> {
                        dead++;
                        try {
                            deviceTokenRepository.deleteByToken(t.getToken());
                        } catch (Exception cleanupErr) {
                            log.warn("push.cleanup failed for {} ({}): {}",
                                    mask(t.getToken()), t.getPlatform(), cleanupErr.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                retry++;
                log.warn("push.deliver failed for token {} ({}): {}",
                        mask(t.getToken()), t.getPlatform(), e.getMessage());
            }
        }
        if (enabled) {
            log.info("push.send to {} platforms={} delivered={} retry={} dead={}",
                    label, tokens.size(), delivered, retry, dead);
        } else {
            log.debug("push.send to {} dry-run={}", label, dryRun);
        }
    }

    private PushResult deliver(DeviceToken token, String title, String body, Map<String, String> data) {
        String platform = token.getPlatform() == null
                ? "" : token.getPlatform().toUpperCase(Locale.ROOT);
        String raw = token.getToken();
        return switch (platform) {
            case "IOS" -> {
                if (!apns.isConfigured()) {
                    log.debug("push: APNs unconfigured, skipping iOS token {}", mask(raw));
                    yield PushResult.RETRY;
                }
                yield apns.send(raw, title, body, data);
            }
            case "ANDROID" -> {
                if (!fcm.isConfigured()) {
                    log.debug("push: FCM unconfigured, skipping Android token {}", mask(raw));
                    yield PushResult.RETRY;
                }
                yield fcm.send(raw, title, body, data);
            }
            case "WEB" -> deliverWeb(raw, title, body, data);
            default -> {
                log.warn("push: unknown platform '{}' for token {}", platform, mask(raw));
                yield PushResult.RETRY;
            }
        };
    }

    /**
     * Browser tokens are either Push API subscription JSON (Web Push + VAPID)
     * or a standalone FCM registration token from the Firebase web SDK.
     */
    private PushResult deliverWeb(String raw, String title, String body, Map<String, String> data) {
        if (WebPushClient.isPushSubscriptionJson(raw)) {
            if (!webPush.isConfigured()) {
                log.debug("push: Web Push (VAPID) not configured, skipping browser subscription");
                return PushResult.RETRY;
            }
            return webPush.send(raw, title, body, data);
        }
        if (!fcm.isConfigured()) {
            log.debug("push: FCM unconfigured, cannot send WEB fcm token {}", mask(raw));
            return PushResult.RETRY;
        }
        return fcm.send(raw, title, body, data);
    }

    private static String mask(String token) {
        if (token == null) return "null";
        if (token.length() < 12) return token;
        return token.substring(0, 6) + "…" + token.substring(token.length() - 4);
    }
}
