package com.lera.identity_service.controller;

import com.lera.identity_service.dto.*;
import com.lera.identity_service.entity.User;
import com.lera.identity_service.repository.UserRepository;
import com.lera.identity_service.security.AuthCookies;
import com.lera.identity_service.security.AuthUser;
import com.lera.identity_service.security.InternalApiKeyValidator;
import com.lera.identity_service.service.JwtService;
import com.lera.identity_service.service.PasswordResetMailService;
import com.lera.identity_service.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Authentication API. Forgot-password emails are sent only when {@code spring.mail.*} and
 * {@code lera.mail.from} are set — see {@code application.yml} in this module.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final UserService userService;
    private final UserRepository userRepository;
    private final Environment environment;
    private final JwtService jwtService;
    private final AuthCookies authCookies;
    private final PasswordResetMailService passwordResetMailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    /** Internal service-to-service API key — MUST be set via environment variable */
    @Value("${lera.internal.api-key:#{null}}")
    private String internalApiKey;

    /** Base URL for links embedded in password-reset emails (see {@code lera.password-reset.frontend-base-url}). */
    @Value("${lera.password-reset.frontend-base-url:http://localhost:3000}")
    private String passwordResetFrontendBaseUrl;
    
    // Thread-safe token store with expiry: token -> { email, expiryMillis }
    private static final Map<String, Map<String, Object>> resetTokens = new ConcurrentHashMap<>();
    /** Reset tokens expire after 15 minutes */
    private static final long RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000;

    /**
     * Evict expired password-reset tokens so the in-memory store cannot grow unbounded
     * from links that are issued but never used. Tokens are still validated on use; this
     * just reclaims memory. Runs every 10 minutes.
     */
    @Scheduled(fixedDelay = 10 * 60 * 1000)
    public void purgeExpiredResetTokens() {
        long now = System.currentTimeMillis();
        int before = resetTokens.size();
        resetTokens.values().removeIf(data -> {
            Object expiry = data.get("expiry");
            return !(expiry instanceof Long) || (Long) expiry < now;
        });
        int removed = before - resetTokens.size();
        if (removed > 0) {
            log.debug("Purged {} expired password-reset token(s)", removed);
        }
    }

    @PostMapping("/register")
    @PreAuthorize("permitAll()")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            @RequestHeader(value = "X-Internal-Key", required = false) String internalKey) {
        // Defence-in-depth: blank or legacy literal is treated as "no internal key configured"
        // so a missing LERA_INTERNAL_API_KEY env never accidentally elevates a public register call.
        boolean keyConfigured = internalApiKey != null
                && !internalApiKey.isBlank()
                && !InternalApiKeyValidator.LEGACY_WEAK_KEY.equals(internalApiKey);
        boolean isInternal = keyConfigured && internalApiKey.equals(internalKey);
        // An authenticated org-wide admin (Chairman/CEO/Super-Admin/Director) creating a user from
        // the admin panel is a privileged creation: honour the requested role and auto-activate,
        // so the Chairman can actually appoint admins/super-admins. Centre-bound roles stay public.
        boolean privileged = isInternal || isAuthenticatedOrgWideAdmin();
        AuthResponse response = userService.register(request, privileged);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    /** True when the current request is made by an authenticated org-wide admin role. */
    private boolean isAuthenticatedOrgWideAdmin() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        java.util.Set<String> orgWide = java.util.Set.of(
                "ROLE_SUPER_ADMIN", "ROLE_SUPERADMIN", "ROLE_CHAIRMAN", "ROLE_CEO", "ROLE_DIRECTOR");
        return auth.getAuthorities().stream().map(Object::toString).anyMatch(orgWide::contains);
    }

    @PostMapping("/login")
    @PreAuthorize("permitAll()")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletResponse httpResponse) {
        AuthResponse response = userService.login(request);
        if (response.isSuccess()) {
            // Mirror the access + refresh tokens into HttpOnly cookies. Browsers
            // get the secure path automatically while non-browser clients can
            // keep using the JSON-body tokens with Authorization: Bearer.
            authCookies.setAuthCookies(httpResponse,
                    response.getToken(),        jwtService.getAccessTokenSeconds(),
                    response.getRefreshToken(), jwtService.getRefreshTokenSeconds());
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Clear the HttpOnly auth cookies. Idempotent — safe to call when the
     * client doesn't actually have any cookies set.
     *
     * <p>Marked {@code permitAll()} so an expired session can still log out.
     */
    @PostMapping("/logout")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, Object>> logout(HttpServletResponse httpResponse) {
        authCookies.clearAuthCookies(httpResponse);
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out"));
    }
    
    @PostMapping("/forgot-password")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, Object>> forgotPassword(@Valid @RequestBody Map<String, String> request) {
        String email = request.get("email");
        Map<String, Object> response = new HashMap<>();
        
        // Always return success to prevent email enumeration
        response.put("success", true);
        response.put("message", "If the email exists, a password reset link has been sent");
        
        // Check if user exists
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            // Generate reset token with expiry
            String token = UUID.randomUUID().toString();
            Map<String, Object> tokenData = new HashMap<>();
            tokenData.put("email", email);
            tokenData.put("expiry", System.currentTimeMillis() + RESET_TOKEN_EXPIRY_MS);
            resetTokens.put(token, tokenData);

            String base = passwordResetFrontendBaseUrl.replaceAll("/$", "");
            String resetUrl = base + "/auth/reset-password?token=" + token;

            boolean prod = java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod");
            boolean emailed = passwordResetMailService.sendPasswordReset(email, resetUrl);
            if (emailed) {
                log.info("Password reset email sent for {}", email);
            } else if (!prod) {
                log.warn("DEV ONLY password reset link for {} — mail not configured; link (never log in prod): {}",
                        email, resetUrl);
            } else {
                log.warn("Password reset requested for {} but outbound mail is not configured (set spring.mail.* and lera.mail.from / spring.mail.username)", email);
            }
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/reset-password")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("password");
        Map<String, Object> response = new HashMap<>();

        // Reject blank / too-short passwords before they are encoded and saved.
        if (newPassword == null || newPassword.trim().length() < 8) {
            response.put("success", false);
            response.put("message", "Password must be at least 8 characters");
            return ResponseEntity.badRequest().body(response);
        }

        // Validate token
        Map<String, Object> tokenData = resetTokens.get(token);
        if (tokenData == null) {
            response.put("success", false);
            response.put("message", "Invalid or expired reset token");
            return ResponseEntity.badRequest().body(response);
        }
        
        // Check token expiry
        long expiry = (Long) tokenData.get("expiry");
        if (System.currentTimeMillis() > expiry) {
            resetTokens.remove(token);
            response.put("success", false);
            response.put("message", "Reset token has expired. Please request a new one.");
            return ResponseEntity.badRequest().body(response);
        }
        
        String email = (String) tokenData.get("email");
        
        // Find user and update password
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            
            // Remove used token
            resetTokens.remove(token);
            
            response.put("success", true);
            response.put("message", "Password has been reset successfully");
            return ResponseEntity.ok(response);
        }
        
        response.put("success", false);
        response.put("message", "User not found");
        return ResponseEntity.badRequest().body(response);
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Not authenticated"));
        }
        
        // Use findByEmailWithRole (or fallback to findById) to avoid LazyInitializationException
        return userRepository.findByEmailWithRole(
                userRepository.findById(authUser.getUserId()).map(User::getEmail).orElse("")
        ).or(() -> userRepository.findById(authUser.getUserId())).map(user -> {
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("fullname", user.getFullname());
            // Safely resolve roleName: prefer eager-loaded role, fallback to authUser claim
            String roleName = authUser.getRoleName();
            if (user.getRole() != null) {
                try { roleName = user.getRole().getName(); } catch (Exception ignored) {}
            }
            response.put("roleName", roleName);
            response.put("roleId", user.getRoleId());
            response.put("centerId", user.getCenterId());
            response.put("avatarUrl", user.getAvatarUrl());
            response.put("phone", user.getPhone());
            response.put("status", user.getStatus());
            response.put("fullnameVi", user.getFullnameVi());
            response.put("success", true);
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.status(404).body(Map.of("success", false, "message", "User not found")));
    }
    
    /**
     * Refresh-token rotation. Accepts the long-lived refresh token in the body
     * ({@code {"refreshToken": "..."}}) and returns a new access token + a
     * fresh refresh token. The frontend stores both — when the access token
     * expires (401), {@code apiFetch} silently calls this once before bouncing
     * the user to login.
     *
     * <p>Marked {@code @PreAuthorize("permitAll()")} to override the class-level
     * role check, since refresh must work for callers whose access token has
     * just expired (i.e. effectively anonymous at the filter layer — also
     * matched in {@code SecurityConfig#filterChain}).
     */
    @PostMapping("/refresh")
    @PreAuthorize("permitAll()")
    public ResponseEntity<AuthResponse> refresh(@RequestBody(required = false) Map<String, String> body,
                                                HttpServletRequest httpRequest,
                                                HttpServletResponse httpResponse) {
        // Accept the refresh token either from the JSON body (legacy frontend)
        // or from the HttpOnly refreshToken cookie (new frontend / curl with
        // -b cookie jar). Body wins if both are present.
        String refreshToken = body == null ? null : body.get("refreshToken");
        if ((refreshToken == null || refreshToken.isBlank()) && httpRequest.getCookies() != null) {
            for (Cookie c : httpRequest.getCookies()) {
                if (AuthCookies.REFRESH_COOKIE.equals(c.getName())
                        && c.getValue() != null && !c.getValue().isEmpty()) {
                    refreshToken = c.getValue();
                    break;
                }
            }
        }
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .success(false)
                    .message("refreshToken is required")
                    .build());
        }

        final String rt = refreshToken;
        try {
            String email = jwtService.extractUsername(rt);
            return userRepository.findByEmailWithRole(email)
                    .or(() -> userRepository.findByEmail(email))
                    .filter(u -> jwtService.isTokenValid(rt, u))
                    .map(user -> {
                        String newAccess  = jwtService.generateToken(user);
                        String newRefresh = jwtService.generateRefreshToken(user);
                        // Rotate the cookies so the next request uses the
                        // freshest pair (and old refresh tokens age out faster).
                        authCookies.setAuthCookies(httpResponse,
                                newAccess,  jwtService.getAccessTokenSeconds(),
                                newRefresh, jwtService.getRefreshTokenSeconds());
                        return ResponseEntity.ok(AuthResponse.builder()
                                .success(true)
                                .message("Token refreshed")
                                .token(newAccess)
                                .refreshToken(newRefresh)
                                .build());
                    })
                    .orElseGet(() -> ResponseEntity.status(401).body(AuthResponse.builder()
                            .success(false)
                            .message("Invalid or expired refresh token")
                            .build()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(AuthResponse.builder()
                    .success(false)
                    .message("Invalid or expired refresh token")
                    .build());
        }
    }

    @GetMapping("/health")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Identity Service is running");
    }
}
