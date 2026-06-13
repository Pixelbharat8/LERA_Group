package com.lera.identity_service.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Sets / clears the HttpOnly cookies that carry the access + refresh JWT.
 *
 * <p>Both tokens are still ALSO returned in the JSON body so that:
 * <ul>
 *   <li>non-browser clients (CLI, mobile, postman) can keep using
 *       {@code Authorization: Bearer ...}</li>
 *   <li>the existing frontend keeps working during the rollout</li>
 * </ul>
 *
 * <p>The {@code Secure} flag is configurable so dev-over-HTTP keeps working.
 * Set {@code lera.cookies.secure=true} in any HTTPS deployment.
 *
 * <p>{@code SameSite=Lax} is safe because all our auth POSTs are same-site
 * (frontend and gateway share the public hostname). Switch to
 * {@code SameSite=None; Secure} if you ever serve the SPA from a different
 * domain than the API.
 */
@Component
public class AuthCookies {

    public static final String ACCESS_COOKIE  = "token";
    public static final String REFRESH_COOKIE = "refreshToken";

    @Value("${lera.cookies.secure:false}")
    private boolean secure;

    @Value("${lera.cookies.same-site:Lax}")
    private String sameSite;

    public void setAuthCookies(HttpServletResponse response,
                                String accessToken, long accessSeconds,
                                String refreshToken, long refreshSeconds) {
        if (accessToken != null) {
            response.addHeader(HttpHeaders.SET_COOKIE, build(ACCESS_COOKIE, accessToken, accessSeconds).toString());
        }
        if (refreshToken != null) {
            response.addHeader(HttpHeaders.SET_COOKIE, build(REFRESH_COOKIE, refreshToken, refreshSeconds).toString());
        }
    }

    public void clearAuthCookies(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, build(ACCESS_COOKIE, "", 0).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, build(REFRESH_COOKIE, "", 0).toString());
    }

    private ResponseCookie build(String name, String value, long maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
    }
}
