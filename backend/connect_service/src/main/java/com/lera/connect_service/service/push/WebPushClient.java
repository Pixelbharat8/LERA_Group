package com.lera.connect_service.service.push;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.Security;
import java.util.HashMap;
import java.util.Map;

/**
 * Browser push via the <b>Web Push Protocol</b> (RFC 8030) using VAPID — the
 * same path Chrome / Firefox / Safari use when {@code PushManager.subscribe}
 * returns a subscription. This is <b>not</b> FCM: the token stored for WEB is
 * JSON from {@code subscription.toJSON()}, and we encrypt + POST to the
 * browser vendor's push endpoint (Mozilla, Google FCM <i>gateway</i>, etc.).
 *
 * <p>For teams that prefer a single FCM token everywhere, the frontend can
 * instead register with the Firebase JS SDK and POST a raw FCM registration
 * token — {@link PushDispatcher} routes non-JSON WEB tokens to {@link FcmClient}.
 *
 * <p>Configuration (all optional — when missing, {@link #isConfigured()} is
 * false and browser pushes are skipped without failing notification creation):
 * <ul>
 *   <li>{@code lera.push.web.vapid.public-key} — URL-safe base64 public key</li>
 *   <li>{@code lera.push.web.vapid.private-key} — URL-safe base64 private key</li>
 *   <li>{@code lera.push.web.vapid.subject} — {@code mailto:…} contact (required by spec)</li>
 * </ul>
 * Generate keys with: {@code npx web-push generate-vapid-keys} (Node) or see
 * {@code scripts/generate-vapid-keys.sh} in the repo root.
 */
@Component
@Slf4j
public class WebPushClient {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Value("${lera.push.web.vapid.public-key:}")
    private String publicKey;

    @Value("${lera.push.web.vapid.private-key:}")
    private String privateKey;

    @Value("${lera.push.web.vapid.subject:mailto:support@leraacademy.edu.vn}")
    private String subject;

    private PushService pushService;

    @PostConstruct
    void init() {
        if (publicKey == null || publicKey.isBlank()
                || privateKey == null || privateKey.isBlank()) {
            log.info("webpush: VAPID keys not set — browser Push API delivery disabled");
            return;
        }
        try {
            Security.addProvider(new BouncyCastleProvider());
            pushService = new PushService(publicKey.trim(), privateKey.trim(), subject.trim());
            log.info("webpush: VAPID PushService initialised (subject={})", subject);
        } catch (Exception e) {
            log.warn("webpush: failed to initialise PushService: {}", e.getMessage());
            pushService = null;
        }
    }

    public boolean isConfigured() {
        return pushService != null;
    }

    /** True when {@code token} looks like a browser {@code PushSubscription} JSON. */
    public static boolean isPushSubscriptionJson(String token) {
        if (token == null) return false;
        String t = token.trim();
        return t.startsWith("{") && t.contains("\"endpoint\"") && t.contains("p256dh");
    }

    /**
     * Sends an encrypted payload to the subscription's endpoint.
     * Never throws — maps all failures to {@link PushResult}.
     */
    public PushResult send(String subscriptionJson, String title, String body) {
        return send(subscriptionJson, title, body, null);
    }

    /** Merges optional {@code data} into the JSON payload (string values only). */
    public PushResult send(String subscriptionJson, String title, String body, Map<String, String> data) {
        if (!isConfigured()) {
            log.debug("webpush: not configured");
            return PushResult.RETRY;
        }
        try {
            Subscription sub = MAPPER.readValue(subscriptionJson.trim(), Subscription.class);
            if (sub.endpoint == null || sub.keys == null
                    || sub.keys.p256dh == null || sub.keys.auth == null) {
                log.warn("webpush: malformed subscription JSON");
                return PushResult.DEAD;
            }

            Map<String, String> envelope = new HashMap<>();
            envelope.put("title", title == null ? "" : title);
            envelope.put("body", body == null ? "" : body);
            if (data != null) {
                for (var e : data.entrySet()) {
                    if (e.getKey() == null || e.getKey().isBlank()) {
                        continue;
                    }
                    envelope.put(e.getKey(), e.getValue() == null ? "" : e.getValue());
                }
            }
            String payload = MAPPER.writeValueAsString(envelope);

            Notification notification = new Notification(sub, payload);
            HttpResponse resp = pushService.send(notification);
            int code = resp.getStatusLine().getStatusCode();
            if (code / 100 == 2) return PushResult.DELIVERED;
            // Subscription gone — user cleared site data or unsubscribed.
            if (code == 404 || code == 410) return PushResult.DEAD;
            log.warn("webpush: upstream returned {}", code);
            return PushResult.RETRY;
        } catch (Exception e) {
            log.warn("webpush: send failed: {}", e.getMessage());
            return PushResult.RETRY;
        }
    }
}
