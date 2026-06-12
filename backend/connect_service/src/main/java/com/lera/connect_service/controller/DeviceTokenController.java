package com.lera.connect_service.controller;

import com.lera.connect_service.entity.DeviceToken;
import com.lera.connect_service.repository.DeviceTokenRepository;
import com.lera.connect_service.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Native push routing — the mobile app calls {@code POST /api/device-tokens}
 * after Capacitor / FCM / APNs hands it a device token.
 *
 * <p>Authorization rules:
 * <ul>
 *   <li>{@code POST /} — body's {@code userId} is ignored; the JWT-derived
 *       caller id is always used (closes the loophole where a logged-in user
 *       could register a token under another user, hijacking their pushes).
 *       Staff-on-behalf is allowed via the optional {@code userIdOverride}
 *       field, gated by role.</li>
 *   <li>{@code GET /me} — the caller's own tokens.</li>
 *   <li>{@code GET /user/{userId}} — staff only.</li>
 *   <li>{@code DELETE /{token}} — only the token's owner or staff can unregister.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/device-tokens")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DeviceTokenController {

    private final DeviceTokenRepository repo;

    @PostMapping
    @Transactional
    public ResponseEntity<DeviceToken> register(@Valid @RequestBody Map<String, Object> body) {
        UUID callerId = CurrentUser.id().orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        UUID userId = callerId;
        Object override = body.get("userIdOverride");
        if (override != null && CurrentUser.isStaff()) {
            try {
                userId = UUID.fromString(String.valueOf(override));
            } catch (IllegalArgumentException ignored) {
                // fall through to caller id
            }
        }

        String token = String.valueOf(body.getOrDefault("token", "")).trim();
        if (token.isEmpty() || "null".equals(token)) {
            return ResponseEntity.badRequest().build();
        }
        String platform = String.valueOf(body.getOrDefault("platform", "WEB")).toUpperCase();
        String deviceName = body.get("deviceName") == null ? null : String.valueOf(body.get("deviceName"));

        DeviceToken row = repo.findByToken(token).orElseGet(DeviceToken::new);
        row.setUserId(userId);
        row.setPlatform(platform);
        row.setToken(token);
        row.setDeviceName(deviceName);
        row.setLastSeenAt(LocalDateTime.now());
        return ResponseEntity.ok(repo.save(row));
    }

    /** The caller's own tokens — preferred client endpoint. */
    @GetMapping("/me")
    public ResponseEntity<List<DeviceToken>> me() {
        UUID me = CurrentUser.id().orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return ResponseEntity.ok(repo.findByUserId(me));
    }

    /** Staff-only: read another user's tokens (e.g. for support / debugging). */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DeviceToken>> byUser(@PathVariable UUID userId) {
        if (!CurrentUser.isSelfOrStaff(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(repo.findByUserId(userId));
    }

    @DeleteMapping("/{token}")
    @Transactional
    public ResponseEntity<Void> unregister(@PathVariable String token) {
        DeviceToken row = repo.findByToken(token).orElse(null);
        if (row == null) return ResponseEntity.noContent().build();
        if (!CurrentUser.isSelfOrStaff(row.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        repo.deleteByToken(token);
        return ResponseEntity.noContent().build();
    }
}
